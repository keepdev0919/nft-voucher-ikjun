const Voucher = artifacts.require("Voucher");

module.exports = function(deployer) {
  deployer.deploy(Voucher);
};
