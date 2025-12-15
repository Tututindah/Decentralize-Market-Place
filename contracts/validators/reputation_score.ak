use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/transaction.{Datum, InlineDatum, OutputReference, Transaction}

pub type ReputationDatum {
  user: VerificationKeyHash,
  did: ByteArray,
  total_jobs: Int,
  completed_jobs: Int,
  cancelled_jobs: Int,
  dispute_count: Int,
  total_earned: Int,
  total_paid: Int,
  average_rating: Int,
  last_updated: Int,
}

pub type ReputationRedeemer {
  UpdateReputation { 
    job_id: ByteArray,
    rating: Int,
    amount: Int,
    completed: Bool
  }
  RecordDispute { job_id: ByteArray }
  UpdateDID { new_did: ByteArray }
}

validator reputation_score {
  spend(
    datum: Option<ReputationDatum>,
    redeemer: ReputationRedeemer,
    _own_ref: OutputReference,
    self: Transaction,
  ) {
    expect Some(rep) = datum
    let user_signed = list.has(self.extra_signatories, rep.user)

    when redeemer is {
      UpdateReputation { job_id: _, rating, amount, completed } -> {
        let has_continuation =
          list.any(
            self.outputs,
            fn(output) {
              when output.datum is {
                InlineDatum(d) -> {
                  expect updated_rep: ReputationDatum = d
                  updated_rep.user == rep.user &&
                  ( if completed {
                      updated_rep.completed_jobs == rep.completed_jobs + 1 &&
                      updated_rep.total_jobs == rep.total_jobs + 1
                    } else {
                      updated_rep.cancelled_jobs == rep.cancelled_jobs + 1 &&
                      updated_rep.total_jobs == rep.total_jobs + 1
                    }
                  ) &&
                  rating >= 0 && rating <= 100
                }
                _ -> False
              }
            },
          )

        user_signed && has_continuation
      }

      RecordDispute { job_id: _ } -> {
        let has_continuation =
          list.any(
            self.outputs,
            fn(output) {
              when output.datum is {
                InlineDatum(d) -> {
                  expect updated_rep: ReputationDatum = d
                  updated_rep.user == rep.user &&
                  updated_rep.dispute_count == rep.dispute_count + 1
                }
                _ -> False
              }
            },
          )

        user_signed && has_continuation
      }

      UpdateDID { new_did } -> {
        let has_continuation =
          list.any(
            self.outputs,
            fn(output) {
              when output.datum is {
                InlineDatum(d) -> {
                  expect updated_rep: ReputationDatum = d
                  updated_rep.user == rep.user &&
                  updated_rep.did == new_did
                }
                _ -> False
              }
            },
          )

        user_signed && has_continuation
      }
    }
  }

  else(_) {
    fail
  }
}
