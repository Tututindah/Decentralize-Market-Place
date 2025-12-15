use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/assets.{PolicyId, AssetName, Value, flatten}
use cardano/transaction.{OutputReference, Transaction, Output, find_input}

pub type TokenDatum {
  owner: VerificationKeyHash,
  policy_id: PolicyId,
  asset_name: AssetName,
  amount: Int,
}

pub type TokenRedeemer {
  Release
}

validator token_escrow {
  spend(
    datum: Option<TokenDatum>,
    redeemer: TokenRedeemer,
    own_ref: OutputReference,
    tx: Transaction,
  ) {
    expect Some(d) = datum
    expect Release = redeemer

    expect Some(own_input) = find_input(tx.inputs, own_ref)
    let own_value = own_input.output.value
    let must_be_signed = list.has(tx.extra_signatories, d.owner)
    let tokens_in_value = flatten(own_value)
    expect Some((policy, name, amount)) = 
      list.find(tokens_in_value, fn(t) { 
        let (pol, nm, _) = t
        pol == d.policy_id && nm == d.asset_name 
      })
    
    let correct_amount = amount >= d.amount

    must_be_signed? && correct_amount?
  }
}
