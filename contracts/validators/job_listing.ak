use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/transaction.{OutputReference, Transaction, InlineDatum}

pub type JobDatum {
  client: VerificationKeyHash,
  client_did: ByteArray,       
  job_id: ByteArray,
  title: ByteArray,
  description_hash: ByteArray,
  budget_min: Int,
  budget_max: Int,
  deadline: Int,
  is_active: Bool,
  kyc_required: Bool,          
}

pub type JobRedeemer {
  UpdateJob { new_description_hash: ByteArray }
  CloseJob
  CancelJob
}

validator job_listing {
  spend(
    datum: Option<JobDatum>,
    redeemer: JobRedeemer,
    _own_ref: OutputReference,
    self: Transaction,
  ) {
    expect Some(job) = datum

    let client_signed = list.has(self.extra_signatories, job.client)

    let has_valid_did = job.client_did != ""

    when redeemer is {
      UpdateJob { new_description_hash } -> {
        let continuing_output =
          list.any(
            self.outputs,
            fn(output) {
              when output.datum is {
                InlineDatum(d) -> {
                  expect updated_job: JobDatum = d
                  updated_job.job_id == job.job_id && updated_job.client == job.client && updated_job.description_hash == new_description_hash && updated_job.client_did == job.client_did
                }
                _ -> False
              }
            },
          )
        client_signed && continuing_output && has_valid_did
      }

      CloseJob -> {
        client_signed && has_valid_did
      }

      CancelJob -> {
        client_signed && has_valid_did
      }
    }
  }

  else(_) {
    fail
  }
}
