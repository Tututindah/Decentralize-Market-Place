use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/assets.{PolicyId}
use cardano/transaction.{Transaction, OutputReference, Mint}

pub type USDMRedeemer {
  Mint
  Burn
}

validator usdm_token {
  mint(redeemer: USDMRedeemer, _policy: PolicyId, self: Transaction) {
    when redeemer is {
      Mint -> True
      Burn -> True
    }
  }

  else(_) {
    fail
  }
}
