package com.ssafy.ttocket.voucher.repository;

import com.ssafy.ttocket.voucher.entity.Program;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProgramRepository extends JpaRepository<Program, Long> {

    List<Program> findAllByOrderByProgramIdDesc();
}
