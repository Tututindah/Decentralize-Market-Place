use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/assets.{PolicyId, AssetName}
use cardano/transaction.{OutputReference, Transaction}

pub type EscrowDatum {
  client: VerificationKeyHash,
  client_did: ByteArray,           
  freelancer: VerificationKeyHash,
  freelancer_did: ByteArray,       
  arbiter: VerificationKeyHash,
  usdm_policy: PolicyId,
  usdm_name: AssetName,
  amount: Int,
  job_id: ByteArray,
}

pub type EscrowRedeemer {
  Release
  Refund
  ReleaseWithArbiter
  Cancel
}

validator freelance_escrow {
  spend(
    datum: Option<EscrowDatum>,
    redeemer: EscrowRedeemer,
    _own_ref: OutputReference,
    self: Transaction,
  ) {
    expect Some(escrow) = datum
    let signatories = self.extra_signatories
    let client_has_did = escrow.client_did != ""
    let freelancer_has_did = escrow.freelancer_did != ""

    when redeemer is {
      Release -> {
        let client_signed = list.has(signatories, escrow.client)
        let freelancer_signed = list.has(signatories, escrow.freelancer)
        client_signed && freelancer_signed && client_has_did && freelancer_has_did
      }

      Refund -> {
        let client_signed = list.has(signatories, escrow.client)
        let arbiter_signed = list.has(signatories, escrow.arbiter)
        client_signed && arbiter_signed && client_has_did
      }

      ReleaseWithArbiter -> {
        let freelancer_signed = list.has(signatories, escrow.freelancer)
        let arbiter_signed = list.has(signatories, escrow.arbiter)
        freelancer_signed && arbiter_signed && freelancer_has_did
      }

      Cancel -> {
        let client_signed = list.has(signatories, escrow.client)
        let freelancer_signed = list.has(signatories, escrow.freelancer)
        let arbiter_signed = list.has(signatories, escrow.arbiter)
        client_signed && freelancer_signed && arbiter_signed && client_has_did && freelancer_has_did
      }
    }
  }

  else(_) {
    fail
  }
}
