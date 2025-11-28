use aiken/collection/list as list
use aiken/crypto.{Blake2b_224, Hash, VerificationKey}
use cardano/assets
use cardano/address
use cardano/transaction.{Output, OutputReference, Transaction}

type VerificationKeyHash =
  Hash<Blake2b_224, VerificationKey>


pub type JobDatum {
  employer: VerificationKeyHash,
  freelancer: VerificationKeyHash, 
  job_id: ByteArray,
}

pub type JobAction {
  ReleasePayment
  CancelJob  
}


fn must_be_signed_by(signatories: List<VerificationKeyHash>, signer: VerificationKeyHash) -> Bool {
  list.has(signatories, signer)
}

fn amount_sent_to(
  outputs: List<Output>,
  receiver: VerificationKeyHash,
  policy_id: ByteArray,
  asset_name: ByteArray,
) -> Int {
  let target_outputs =
    list.filter(
      outputs,
      fn(out) {
        // VerificationKey harus di-wrap agar sesuai dengan tipe payment_credential
        out.address.payment_credential == address.VerificationKey(receiver)
      },
    )

  list.foldl(
    target_outputs,
    0,
    fn(out, total) {
      total + assets.quantity_of(out.value, policy_id, asset_name)
    },
  )
}

fn get_own_input_amount(
  tx: Transaction,
  out_ref: OutputReference,
  policy_id: ByteArray,
  asset_name: ByteArray,
) -> Int {
  expect Some(own_input) =
    list.find(tx.inputs, fn(input) { input.output_reference == out_ref })

  assets.quantity_of(own_input.output.value, policy_id, asset_name)
}


validator decentgigs(usdm_policy_id: ByteArray, usdm_asset_name: ByteArray) {

  spend(datum: Option<JobDatum>, redeemer: JobAction, own_ref: OutputReference, tx: Transaction) {

    expect Some(d) = datum
    let signatories = tx.extra_signatories

    when redeemer is {
      ReleasePayment -> {
        let signed_by_employer = must_be_signed_by(signatories, d.employer)
        let signed_by_freelancer = must_be_signed_by(signatories, d.freelancer)
        let locked_amount = get_own_input_amount(tx, own_ref, usdm_policy_id, usdm_asset_name)
        let amount_to_freelancer = amount_sent_to(tx.outputs, d.freelancer, usdm_policy_id, usdm_asset_name)
        signed_by_employer && signed_by_freelancer && (amount_to_freelancer >= locked_amount)
      }

      CancelJob -> {
        let signed_by_employer = must_be_signed_by(signatories, d.employer)
        let signed_by_freelancer = must_be_signed_by(signatories, d.freelancer)

        let locked_amount = get_own_input_amount(tx, own_ref, usdm_policy_id, usdm_asset_name)
        let amount_to_employer = amount_sent_to(tx.outputs, d.employer, usdm_policy_id, usdm_asset_name)

        signed_by_employer && signed_by_freelancer && (amount_to_employer >= locked_amount)
      }
    }
  }
}

// ============================================================================
// UNIT TESTS
// ============================================================================

test must_be_signed_by_finds_signer() {
  let pkh1 = #"aabbccdd"
  let pkh2 = #"11223344"
  let signatories = [pkh1, pkh2]

  must_be_signed_by(signatories, pkh1) && must_be_signed_by(signatories, pkh2)
}

test must_be_signed_by_rejects_missing_signer() {
  let pkh1 = #"aabbccdd"
  let pkh2 = #"11223344"
  let pkh3 = #"55667788"
  let signatories = [pkh1, pkh2]

  !must_be_signed_by(signatories, pkh3)
}