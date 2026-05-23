const Voucher = artifacts.require("Voucher");

module.exports = async function (deployer, network, accounts) {
  // 1) Voucher 컨트랙트 배포
  await deployer.deploy(Voucher);
  const voucher = await Voucher.deployed();

  // 2) 배포자(= accounts[0] = 백엔드 지갑)를 approvedMerchant 화이트리스트에 자동 등록.
  //    useVoucherByMerchant(메타-트랜잭션) 호출이 가능하려면 msg.sender(=백엔드)가
  //    승인된 가맹점으로 등록되어 있어야 함. 이거 없으면 결제 시 "unapproved merchant"로 revert.
  //
  //    실제 시연 때는 어드민 계정으로 추가 가맹점도 어드민 API를 통해 승인할 수 있음.
  await voucher.approveMerchant(accounts[0], true);

  console.log("✅ Voucher 배포 완료");
  console.log("   contract address:", voucher.address);
  console.log("   백엔드 지갑 자동 화이트리스트 완료:", accounts[0]);
};
