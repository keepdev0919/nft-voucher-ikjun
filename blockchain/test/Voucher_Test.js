const Voucher = artifacts.require("Voucher");

contract("Voucher", function ([deployer, user1, user2, merchant1, merchant2]) {
  let voucher;

  // 공통 프로그램 파라미터
  const PROGRAM_ID = 1;
  const PROGRAM_NAME = "급식 바우처";
  const AMOUNT = web3.utils.toWei("0.1", "ether"); // 0.1 ETH 단위 금액
  const CATEGORY = "식비";

  // 만료 타임스탬프: 현재 + 30일
  const EXPIRY_FUTURE = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
  // 만료된 타임스탬프: 현재 - 1일
  const EXPIRY_PAST = Math.floor(Date.now() / 1000) - 24 * 60 * 60;

  beforeEach(async () => {
    voucher = await Voucher.new({ from: deployer });
  });

  // ──────────────────────────────────────────────
  //  1. createVoucherProgram
  // ──────────────────────────────────────────────
  describe("createVoucherProgram", function () {
    it("프로그램을 생성하고 조회 시 올바른 값이 반환되어야 한다", async () => {
      await voucher.createVoucherProgram(
        PROGRAM_ID,
        PROGRAM_NAME,
        AMOUNT,
        EXPIRY_FUTURE,
        100,
        CATEGORY,
        { from: deployer }
      );

      const program = await voucher.programs(PROGRAM_ID);

      assert.equal(program.programId.toString(), PROGRAM_ID.toString(), "programId 불일치");
      assert.equal(program.name, PROGRAM_NAME, "name 불일치");
      assert.equal(program.amount.toString(), AMOUNT.toString(), "amount 불일치");
      assert.equal(program.expiryDate.toString(), EXPIRY_FUTURE.toString(), "expiryDate 불일치");
      assert.equal(program.totalSupply.toString(), "100", "totalSupply 불일치");
      assert.equal(program.category, CATEGORY, "category 불일치");
      assert.equal(program.issuer, deployer, "issuer 불일치");
    });

    it("owner가 아닌 계정이 호출하면 revert되어야 한다", async () => {
      try {
        await voucher.createVoucherProgram(
          PROGRAM_ID,
          PROGRAM_NAME,
          AMOUNT,
          EXPIRY_FUTURE,
          100,
          CATEGORY,
          { from: user1 }
        );
        assert.fail("revert가 발생해야 함");
      } catch (err) {
        assert.ok(err.message.includes("revert"), "revert 메시지가 포함되어야 함");
      }
    });
  });

  // ──────────────────────────────────────────────
  //  2. mintVoucher
  // ──────────────────────────────────────────────
  describe("mintVoucher", function () {
    beforeEach(async () => {
      await voucher.createVoucherProgram(
        PROGRAM_ID,
        PROGRAM_NAME,
        AMOUNT,
        EXPIRY_FUTURE,
        100,
        CATEGORY,
        { from: deployer }
      );
    });

    it("민팅 후 수신자가 NFT를 소유하고 status가 1(미사용)이어야 한다", async () => {
      const tx = await voucher.mintVoucher(PROGRAM_ID, user1, { from: deployer });

      // 반환된 tokenId 확인 (로그 또는 직접 조회)
      const tokenId = 1; // 첫 번째 민팅 = tokenId 1

      // ERC-721 소유권 확인
      const nftOwner = await voucher.ownerOf(tokenId);
      assert.equal(nftOwner, user1, "NFT 소유자가 user1이어야 함");

      // VoucherInfo 확인
      const info = await voucher.voucherInfos(tokenId);
      assert.equal(info.tokenId.toString(), tokenId.toString(), "tokenId 불일치");
      assert.equal(info.programId.toString(), PROGRAM_ID.toString(), "programId 불일치");
      assert.equal(info.amount.toString(), AMOUNT.toString(), "amount 불일치");
      assert.equal(info.status.toString(), "1", "status가 1(미사용)이어야 함");
      assert.equal(info.owner, user1, "owner가 user1이어야 함");

      // 이벤트 확인
      const event = tx.logs.find((l) => l.event === "VoucherMinted");
      assert.ok(event, "VoucherMinted 이벤트가 발생해야 함");
      assert.equal(event.args.recipient, user1, "이벤트 recipient 불일치");
      assert.equal(event.args.programId.toString(), PROGRAM_ID.toString(), "이벤트 programId 불일치");
    });

    it("totalSupply 초과 민팅 시 revert되어야 한다", async () => {
      // totalSupply=1짜리 프로그램 생성
      await voucher.createVoucherProgram(2, "한정 바우처", AMOUNT, EXPIRY_FUTURE, 1, CATEGORY, {
        from: deployer,
      });

      await voucher.mintVoucher(2, user1, { from: deployer }); // 1번째 — 성공

      try {
        await voucher.mintVoucher(2, user2, { from: deployer }); // 2번째 — 실패
        assert.fail("revert가 발생해야 함");
      } catch (err) {
        assert.ok(err.message.includes("revert"), "revert 메시지가 포함되어야 함");
      }
    });
  });

  // ──────────────────────────────────────────────
  //  3. useVoucher
  // ──────────────────────────────────────────────
  describe("useVoucher", function () {
    const TOKEN_ID = 1;
    const USE_AMOUNT = web3.utils.toWei("0.04", "ether");

    beforeEach(async () => {
      await voucher.createVoucherProgram(
        PROGRAM_ID,
        PROGRAM_NAME,
        AMOUNT,
        EXPIRY_FUTURE,
        100,
        CATEGORY,
        { from: deployer }
      );
      await voucher.mintVoucher(PROGRAM_ID, user1, { from: deployer });
    });

    it("부분 사용 후 amount가 감소하고 status는 1(미사용)을 유지해야 한다", async () => {
      const tx = await voucher.useVoucher(TOKEN_ID, USE_AMOUNT, { from: user1 });

      const info = await voucher.voucherInfos(TOKEN_ID);
      const expectedRemaining = BigInt(AMOUNT) - BigInt(USE_AMOUNT);

      assert.equal(
        info.amount.toString(),
        expectedRemaining.toString(),
        "잔액이 usedAmount만큼 감소해야 함"
      );
      assert.equal(info.status.toString(), "1", "부분 사용 후 status는 아직 1이어야 함");

      // 이벤트 확인
      const event = tx.logs.find((l) => l.event === "VoucherUsed");
      assert.ok(event, "VoucherUsed 이벤트가 발생해야 함");
      assert.equal(event.args.usedAmount.toString(), USE_AMOUNT.toString(), "이벤트 usedAmount 불일치");
    });

    it("전액 사용 후 amount가 0이 되고 status가 2(사용완료)로 변경되어야 한다", async () => {
      await voucher.useVoucher(TOKEN_ID, AMOUNT, { from: user1 });

      const info = await voucher.voucherInfos(TOKEN_ID);
      assert.equal(info.amount.toString(), "0", "전액 사용 후 amount가 0이어야 함");
      assert.equal(info.status.toString(), "2", "전액 사용 후 status가 2(사용완료)여야 함");
    });

    it("소유자가 아닌 계정이 useVoucher 호출 시 revert되어야 한다", async () => {
      try {
        await voucher.useVoucher(TOKEN_ID, USE_AMOUNT, { from: user2 });
        assert.fail("revert가 발생해야 함");
      } catch (err) {
        assert.ok(err.message.includes("revert"), "revert 메시지가 포함되어야 함");
      }
    });

    it("이미 전액 사용된(status=2) 바우처를 다시 사용하려 하면 revert되어야 한다", async () => {
      await voucher.useVoucher(TOKEN_ID, AMOUNT, { from: user1 });

      try {
        await voucher.useVoucher(TOKEN_ID, USE_AMOUNT, { from: user1 });
        assert.fail("revert가 발생해야 함");
      } catch (err) {
        assert.ok(err.message.includes("revert"), "revert 메시지가 포함되어야 함");
      }
    });

    it("잔액보다 많은 금액을 사용하려 하면 revert되어야 한다", async () => {
      const overAmount = web3.utils.toWei("1", "ether"); // AMOUNT보다 큰 값
      try {
        await voucher.useVoucher(TOKEN_ID, overAmount, { from: user1 });
        assert.fail("revert가 발생해야 함");
      } catch (err) {
        assert.ok(err.message.includes("revert"), "revert 메시지가 포함되어야 함");
      }
    });
  });

  // ──────────────────────────────────────────────
  //  4. isValidVoucher
  // ──────────────────────────────────────────────
  describe("isValidVoucher", function () {
    it("정상 미사용 바우처는 valid=true를 반환해야 한다", async () => {
      await voucher.createVoucherProgram(
        PROGRAM_ID, PROGRAM_NAME, AMOUNT, EXPIRY_FUTURE, 100, CATEGORY, { from: deployer }
      );
      await voucher.mintVoucher(PROGRAM_ID, user1, { from: deployer });

      const [valid, info] = await voucher.isValidVoucher(1);
      assert.equal(valid, true, "유효한 바우처는 valid=true여야 함");
      assert.equal(info.status.toString(), "1", "status가 1이어야 함");
    });

    it("전액 사용완료(status=2) 바우처는 valid=false를 반환해야 한다", async () => {
      await voucher.createVoucherProgram(
        PROGRAM_ID, PROGRAM_NAME, AMOUNT, EXPIRY_FUTURE, 100, CATEGORY, { from: deployer }
      );
      await voucher.mintVoucher(PROGRAM_ID, user1, { from: deployer });
      await voucher.useVoucher(1, AMOUNT, { from: user1 });

      const [valid, info] = await voucher.isValidVoucher(1);
      assert.equal(valid, false, "사용완료 바우처는 valid=false여야 함");
      assert.equal(info.status.toString(), "2", "status가 2여야 함");
    });

    it("만료된 expiryDate를 가진 바우처는 valid=false를 반환해야 한다", async () => {
      // 만료 프로그램 생성 (expiryDate = 과거 타임스탬프)
      await voucher.createVoucherProgram(
        2, "만료 바우처", AMOUNT, EXPIRY_PAST, 100, CATEGORY, { from: deployer }
      );
      await voucher.mintVoucher(2, user1, { from: deployer });

      const [valid] = await voucher.isValidVoucher(2); // tokenId=2
      assert.equal(valid, false, "만료된 바우처는 valid=false여야 함");
    });

    it("존재하지 않는 tokenId는 valid=false를 반환해야 한다", async () => {
      const [valid] = await voucher.isValidVoucher(9999);
      assert.equal(valid, false, "존재하지 않는 tokenId는 valid=false여야 함");
    });
  });

  // ──────────────────────────────────────────────
  //  5. Soulbound: transfer 차단
  // ──────────────────────────────────────────────
  describe("Soulbound transfer 차단", function () {
    beforeEach(async () => {
      await voucher.createVoucherProgram(
        PROGRAM_ID, PROGRAM_NAME, AMOUNT, EXPIRY_FUTURE, 100, CATEGORY, { from: deployer }
      );
      await voucher.mintVoucher(PROGRAM_ID, user1, { from: deployer });
    });

    it("transferFrom 호출 시 revert되어야 한다", async () => {
      try {
        await voucher.transferFrom(user1, user2, 1, { from: user1 });
        assert.fail("revert가 발생해야 함");
      } catch (err) {
        assert.ok(
          err.message.includes("non-transferable"),
          "non-transferable 메시지가 포함되어야 함"
        );
      }
    });
  });

  // ──────────────────────────────────────────────
  //  6. registerMerchant / isMerchant / approveMerchant
  // ──────────────────────────────────────────────
  describe("가맹점 등록 및 승인", function () {
    it("가맹점 등록 후 isMerchant는 false(미승인 상태)여야 한다", async () => {
      await voucher.registerMerchant("테스트 식당", "식비", { from: merchant1 });

      const approved = await voucher.isMerchant(merchant1);
      assert.equal(approved, false, "등록 직후 미승인 상태여야 함");

      const info = await voucher.merchants(merchant1);
      assert.equal(info.name, "테스트 식당", "가맹점 이름 불일치");
    });

    it("approveMerchant 후 isMerchant가 true여야 한다", async () => {
      await voucher.registerMerchant("테스트 식당", "식비", { from: merchant1 });
      await voucher.approveMerchant(merchant1, { from: deployer });

      const approved = await voucher.isMerchant(merchant1);
      assert.equal(approved, true, "승인 후 isMerchant=true여야 함");
    });

    it("동일 주소로 중복 등록 시 revert되어야 한다", async () => {
      await voucher.registerMerchant("테스트 식당", "식비", { from: merchant1 });
      try {
        await voucher.registerMerchant("다른 이름", "교통", { from: merchant1 });
        assert.fail("revert가 발생해야 함");
      } catch (err) {
        assert.ok(err.message.includes("revert"), "revert 메시지가 포함되어야 함");
      }
    });
  });
});
