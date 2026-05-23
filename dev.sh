#!/bin/bash
# =============================================================================
# Voucher 풀스택 개발 환경 관리 스크립트
#
# Usage:
#   ./dev.sh setup    # 최초 1회 — 의존성 설치 + DB + ganache + 컨트랙트 배포 + 주소 자동 박기
#   ./dev.sh up       # 풀스택 띄움 (ganache + 백엔드 + 프론트)
#   ./dev.sh down     # 풀스택 종료
#   ./dev.sh status   # 각 프로세스 상태
#   ./dev.sh logs <ganache|backend|frontend|all>  # 로그 tail
#
# Ganache는 --database.dbPath로 영구화되어 있어서 down 후 up 해도 컨트랙트 그대로.
# =============================================================================

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
GANACHE_DB="$ROOT/.ganache-db"
PID_DIR="$ROOT/.dev-pids"
LOG_DIR="$ROOT/.dev-logs"

mkdir -p "$PID_DIR" "$LOG_DIR"

# -----------------------------------------------------------------------------
# 개별 프로세스 관리 함수
# -----------------------------------------------------------------------------

is_running() {
  local name="$1"
  [ -f "$PID_DIR/$name.pid" ] && kill -0 "$(cat "$PID_DIR/$name.pid")" 2>/dev/null
}

ganache_start() {
  if is_running ganache; then
    echo "✓ Ganache 이미 실행 중 (pid $(cat "$PID_DIR/ganache.pid"))"
    return
  fi
  echo "→ Ganache 시작 (port 7545, deterministic, db=$GANACHE_DB)..."
  nohup ganache \
    --port 7545 \
    --chain.chainId 1337 \
    --deterministic \
    --database.dbPath "$GANACHE_DB" \
    > "$LOG_DIR/ganache.log" 2>&1 &
  echo $! > "$PID_DIR/ganache.pid"
  sleep 3
  if is_running ganache; then
    echo "✓ Ganache 시작됨 (pid $(cat "$PID_DIR/ganache.pid"))"
  else
    echo "✗ Ganache 시작 실패. 로그 확인: ./dev.sh logs ganache"
    exit 1
  fi
}

backend_start() {
  if is_running backend; then
    echo "✓ Backend 이미 실행 중 (pid $(cat "$PID_DIR/backend.pid"))"
    return
  fi
  echo "→ Backend 시작 (Spring Boot, port 8080)..."
  (cd "$ROOT/backend" && nohup ./gradlew bootRun > "$LOG_DIR/backend.log" 2>&1 & echo $! > "$PID_DIR/backend.pid")
  echo "✓ Backend 시작 중 (pid $(cat "$PID_DIR/backend.pid"))."
  echo "  부팅에 30~60초 걸림. 로그 보려면: ./dev.sh logs backend"
}

frontend_start() {
  if is_running frontend; then
    echo "✓ Frontend 이미 실행 중 (pid $(cat "$PID_DIR/frontend.pid"))"
    return
  fi
  echo "→ Frontend 시작 (React, port 3000)..."
  (cd "$ROOT/frontend" && BROWSER=none nohup npm start > "$LOG_DIR/frontend.log" 2>&1 & echo $! > "$PID_DIR/frontend.pid")
  echo "✓ Frontend 시작됨 (pid $(cat "$PID_DIR/frontend.pid"))"
}

stop_one() {
  local name="$1"
  local port=""
  case "$name" in
    ganache)  port=7545 ;;
    backend)  port=8080 ;;
    frontend) port=3000 ;;
  esac

  if [ -f "$PID_DIR/$name.pid" ]; then
    local pid
    pid="$(cat "$PID_DIR/$name.pid")"
    if kill -0 "$pid" 2>/dev/null; then
      echo "→ $name 종료 중 (pid $pid)..."
      # 1단계: 자식 프로세스 먼저 죽임 (gradle/npm이 트리로 띄움)
      pkill -P "$pid" 2>/dev/null || true
      # 2단계: 본체 SIGTERM
      kill "$pid" 2>/dev/null || true
      sleep 1
      # 3단계: 아직 살아있으면 SIGKILL
      kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$PID_DIR/$name.pid"
  fi

  # 4단계: 포트 점유 좀비 프로세스 강제 정리 (pkill로도 안 잡힌 손자 프로세스 대비)
  if [ -n "$port" ]; then
    local zombie_pids
    zombie_pids="$(lsof -ti :"$port" 2>/dev/null || true)"
    if [ -n "$zombie_pids" ]; then
      echo "  포트 $port 점유 중인 좀비 프로세스 정리: $zombie_pids"
      echo "$zombie_pids" | xargs kill -9 2>/dev/null || true
    fi
  fi

  echo "✓ $name 종료됨"
}

# -----------------------------------------------------------------------------
# 메인 커맨드
# -----------------------------------------------------------------------------

cmd="${1:-}"

case "$cmd" in
  up)
    ganache_start
    backend_start
    frontend_start
    echo ""
    echo "==================== 풀스택 시작 ===================="
    echo "  Ganache:  http://127.0.0.1:7545"
    echo "  Backend:  http://localhost:8080 (Swagger: /swagger-ui.html)"
    echo "  Frontend: http://localhost:3000"
    echo ""
    echo "  로그 보기: ./dev.sh logs <ganache|backend|frontend|all>"
    echo "  종료:     ./dev.sh down"
    echo "===================================================="
    ;;

  down)
    stop_one frontend
    stop_one backend
    stop_one ganache
    echo ""
    echo "✓ 모두 종료됨"
    ;;

  status)
    for name in ganache backend frontend; do
      if is_running "$name"; then
        echo "✓ $name: 실행 중 (pid $(cat "$PID_DIR/$name.pid"))"
      else
        echo "✗ $name: 종료됨"
      fi
    done
    ;;

  logs)
    target="${2:-all}"
    case "$target" in
      ganache|backend|frontend)
        echo "Tailing $target log (Ctrl+C로 빠짐)..."
        tail -f "$LOG_DIR/$target.log"
        ;;
      all)
        echo "Tailing all logs (Ctrl+C로 빠짐)..."
        tail -f "$LOG_DIR/ganache.log" "$LOG_DIR/backend.log" "$LOG_DIR/frontend.log"
        ;;
      *)
        echo "Usage: ./dev.sh logs <ganache|backend|frontend|all>"
        exit 1
        ;;
    esac
    ;;

  setup)
    echo "============== 풀스택 최초 셋업 =============="
    echo ""
    echo "[1/5] blockchain 의존성 설치..."
    (cd "$ROOT/blockchain" && npm install)
    echo ""
    echo "[2/5] frontend 의존성 설치..."
    (cd "$ROOT/frontend" && npm install)
    echo ""
    echo "[3/5] MySQL DB 생성 시도..."
    if mysql -u root -e "CREATE DATABASE IF NOT EXISTS nft_voucher;" 2>/dev/null; then
      echo "  ✓ nft_voucher DB 준비됨"
    else
      echo "  ⚠ DB 생성 실패. MySQL 비번 있으면 'mysql -u root -p -e \"CREATE DATABASE IF NOT EXISTS nft_voucher;\"' 수동 실행"
      echo "  그 후 application.yml의 datasource.password도 갱신"
    fi
    echo ""
    echo "[4/5] Ganache 띄우고 컨트랙트 배포..."
    ganache_start
    sleep 2
    (cd "$ROOT/blockchain" && truffle migrate --reset --network development 2>&1) | tee /tmp/voucher-migrate.log
    echo ""

    # 컨트랙트 주소 파싱: migration 스크립트의 console.log 우선, fallback으로 truffle 기본 출력
    CONTRACT_ADDR="$(grep "contract address:" /tmp/voucher-migrate.log | tail -1 | awk -F': *' '{print $NF}' | tr -d ' ')"

    if [ -z "$CONTRACT_ADDR" ] || [[ ! "$CONTRACT_ADDR" =~ ^0x[0-9a-fA-F]{40}$ ]]; then
      echo "  ⚠ 컨트랙트 주소 자동 추출 실패. /tmp/voucher-migrate.log 확인 후 수동 갱신 필요"
      exit 1
    fi

    echo "  Voucher 컨트랙트 주소: $CONTRACT_ADDR"
    echo ""
    echo "[5/5] 설정 파일에 컨트랙트 주소 자동 갱신..."

    # application.yml의 contract-address 라인 갱신
    if [ -f "$ROOT/backend/src/main/resources/application.yml" ]; then
      sed -i.bak "s|contract-address:.*|contract-address: \"$CONTRACT_ADDR\"|" \
        "$ROOT/backend/src/main/resources/application.yml"
      echo "  ✓ backend/src/main/resources/application.yml 갱신"
    else
      echo "  ⚠ application.yml 없음 — 직접 생성 필요"
    fi

    # .env.local의 REACT_APP_CONTRACT_ADDRESS 갱신
    if [ -f "$ROOT/frontend/.env.local" ]; then
      sed -i.bak "s|REACT_APP_CONTRACT_ADDRESS=.*|REACT_APP_CONTRACT_ADDRESS=$CONTRACT_ADDR|" \
        "$ROOT/frontend/.env.local"
      echo "  ✓ frontend/.env.local 갱신"
    else
      echo "  ⚠ .env.local 없음"
    fi

    echo ""
    echo "============== 셋업 완료 =============="
    echo "이제 './dev.sh up' 으로 백엔드/프론트 띄우면 됨"
    echo "(Ganache는 이미 백그라운드에 떠있음)"
    ;;

  *)
    cat <<EOF
Voucher 풀스택 개발 스크립트

Usage:
  ./dev.sh setup    최초 1회 — npm install + DB 생성 + Ganache + 컨트랙트 배포 + 주소 자동 박기
  ./dev.sh up       풀스택 띄움 (ganache + 백엔드 + 프론트 모두 백그라운드)
  ./dev.sh down     풀스택 종료
  ./dev.sh status   각 프로세스 상태
  ./dev.sh logs <ganache|backend|frontend|all>   로그 tail

Ganache는 --database.dbPath=$GANACHE_DB 로 영구화됨.
한 번 컨트랙트 배포하면 down 후 up 해도 상태 그대로 유지.
EOF
    exit 1
    ;;
esac
