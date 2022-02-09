//SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {EIP712MetaTransaction} from "./EIP712MetaTransaction.sol";
import {Config} from "./Config.sol";
contract Pay is Ownable, EIP712MetaTransaction("Pay", "1")  {
  address public payback_token;
  address public payback_owner;
  address public config;
  
  uint public minAmount = 10 ** 18;
  uint public minPayback = 10 ** 18;
  uint public minFee = 10 ** 18;
  uint public fee;
  uint public rate = 10 * 10 ** 18;
  
  event Payment(address indexed from, address indexed to, address indexed from_token, address to_token, uint from_amount, uint to_amount, uint fee, string ref, uint payback);
  
  constructor(uint _fee, address _payback_token, address _payback_owner, address _config) public {
    require(_fee <= 10000, "fee must be less than or equal to 10000");
    fee = _fee;
    payback_token = _payback_token;
    payback_owner = _payback_owner;
    config = _config;
  }
  
  function _payback (uint amount) internal {
    IERC20(payback_token).transferFrom(payback_owner, msgSender(), amount);
  }
  
  function _calcFees(uint amount, uint payback) internal view returns(uint tx_fee, uint payback_amount){
    require(payback <= 10000, "payback must be equal to or less than 10000");
    require(minAmount < amount, "amount too small");
    payback_amount = amount.mul(payback).div(10000);
    if(payback_amount < minPayback) payback_amount = minPayback;
    uint base_tx_fee = amount.mul(fee).div(10000);
    if(base_tx_fee < minFee) base_tx_fee = minFee;
    tx_fee = base_tx_fee > payback_amount ? base_tx_fee : payback_amount;
    if(tx_fee > amount) tx_fee = amount;
  }
  
  function toWP(uint amount) public view returns (uint){
    return amount.mul(rate).div(10 ** 18);
  }
  
  function pay(address to, string memory ref, uint payback) public payable {
    uint amount = msg.value;
    uint wp = toWP(amount);
    (, uint payback_amount) = _calcFees(wp, payback);
    (uint tx_fee_astr,) = _calcFees(amount, payback);
    payable(to).transfer(amount.sub(tx_fee_astr));
    payable(owner()).transfer(tx_fee_astr);
    emit Payment(msgSender(), to, address(0), address(0), amount, amount, tx_fee_astr, ref, payback_amount);
    Config(config).recordWP(msgSender(), to, payback_amount);
    _payback(payback_amount);
  }
  
  function setMinAmount(uint _int) public onlyOwner {
    minAmount = _int;
  }
  
  function setMinFee(uint _int) public onlyOwner {
    minFee = _int;
  }
  
  function setMinPayback(uint _int) public onlyOwner {
    minPayback = _int;
  }

  function setFee(uint _int) public onlyOwner {
    fee = _int;
  }
  
  function setRate(uint _int) public onlyOwner {
    rate = _int;
  }
  
}
