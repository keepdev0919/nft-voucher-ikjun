package com.voucher.repository;

import com.voucher.domain.PaymentSession;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentSessionRepository extends JpaRepository<PaymentSession, String> {
}
