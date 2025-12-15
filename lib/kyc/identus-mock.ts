
export interface DIDDocument {
  did: string
  publicKey: string
  created: string
  updated: string
  verified: boolean
  credentials: VerifiableCredential[]
}

export interface VerifiableCredential {
  id: string
  type: string[]
  issuer: string
  issuanceDate: string
  expirationDate?: string
  credentialSubject: {
    id: string
    [key: string]: any
  }
  proof?: {
    type: string
    created: string
    verificationMethod: string
    proofValue: string
  }
}

export interface KYCData {
  fullName: string
  email: string
  country: string
  documentType: 'passport' | 'id_card' | 'drivers_license'
  documentNumber: string
  verified: boolean
  verificationDate?: string
}

const DID_PREFIX = 'did:prism:'
const ISSUER_DID = 'did:prism:decentgigs-issuer-001'

/**
 * Generate a mock DID for a wallet address
 */
export function generateDID(walletAddress: string): string {
  const hash = simpleHash(walletAddress)
  return `${DID_PREFIX}${hash}`
}

/**
 * Create a mock DID document
 */
export function createDIDDocument(walletAddress: string): DIDDocument {
  const did = generateDID(walletAddress)
  const publicKey = walletAddress // Simplified - use wallet address as public key

  return {
    did,
    publicKey,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    verified: false,
    credentials: [],
  }
}

/**
 * Issue a KYC credential (mock)
 */
export function issueKYCCredential(
  did: string,
  kycData: KYCData
): VerifiableCredential {
  const credentialId = `${did}/credentials/${Date.now()}`

  return {
    id: credentialId,
    type: ['VerifiableCredential', 'KYCCredential'],
    issuer: ISSUER_DID,
    issuanceDate: new Date().toISOString(),
    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
    credentialSubject: {
      id: did,
      fullName: kycData.fullName,
      email: kycData.email,
      country: kycData.country,
      documentType: kycData.documentType,
      verified: true,
      verificationLevel: 'FULL', // BASIC, STANDARD, FULL
    },
    proof: {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      verificationMethod: `${ISSUER_DID}#key-1`,
      proofValue: mockSignature(credentialId),
    },
  }
}

/**
 * Verify a DID and its KYC credentials
 */
export function verifyDID(didDocument: DIDDocument): {
  valid: boolean
  verified: boolean
  kycStatus: 'none' | 'pending' | 'verified' | 'expired'
  message: string
} {
  if (!didDocument.did.startsWith(DID_PREFIX)) {
    return {
      valid: false,
      verified: false,
      kycStatus: 'none',
      message: 'Invalid DID format',
    }
  }

  const kycCredential = didDocument.credentials.find((c) =>
    c.type.includes('KYCCredential')
  )

  if (!kycCredential) {
    return {
      valid: true,
      verified: false,
      kycStatus: 'none',
      message: 'No KYC credential found',
    }
  }

  const isExpired =
    kycCredential.expirationDate &&
    new Date(kycCredential.expirationDate) < new Date()

  if (isExpired) {
    return {
      valid: true,
      verified: false,
      kycStatus: 'expired',
      message: 'KYC credential expired',
    }
  }

  return {
    valid: true,
    verified: true,
    kycStatus: 'verified',
    message: 'DID verified with valid KYC credential',
  }
}

/**
 * Store DID document in browser (mock storage)
 */
export function storeDID(walletAddress: string, didDocument: DIDDocument): void {
  const key = `decentgigs_did_${walletAddress}`
  localStorage.setItem(key, JSON.stringify(didDocument))
}

/**
 * Retrieve DID document from storage
 */
export function retrieveDID(walletAddress: string): DIDDocument | null {
  const key = `decentgigs_did_${walletAddress}`
  const stored = localStorage.getItem(key)

  if (!stored) {
    return null
  }

  try {
    return JSON.parse(stored)
  } catch (error) {
    console.error('Failed to parse DID document:', error)
    return null
  }
}

/**
 * Complete KYC verification flow (mock)
 */
export async function completeKYC(
  walletAddress: string,
  kycData: KYCData
): Promise<DIDDocument> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Get or create DID document
  let didDocument = retrieveDID(walletAddress)

  if (!didDocument) {
    didDocument = createDIDDocument(walletAddress)
  }

  // Issue KYC credential
  const kycCredential = issueKYCCredential(didDocument.did, kycData)

  // Add credential to DID document
  didDocument.credentials.push(kycCredential)
  didDocument.verified = true
  didDocument.updated = new Date().toISOString()

  // Store updated DID document
  storeDID(walletAddress, didDocument)

  return didDocument
}

/**
 * Check if wallet has valid KYC
 */
export function hasValidKYC(walletAddress: string): boolean {
  const didDocument = retrieveDID(walletAddress)

  if (!didDocument) {
    return false
  }

  const verification = verifyDID(didDocument)
  return verification.verified && verification.kycStatus === 'verified'
}

/**
 * Get KYC status for a wallet
 */
export function getKYCStatus(walletAddress: string): {
  hasKYC: boolean
  verified: boolean
  did: string | null
  expirationDate: string | null
} {
  const didDocument = retrieveDID(walletAddress)

  if (!didDocument) {
    return {
      hasKYC: false,
      verified: false,
      did: null,
      expirationDate: null,
    }
  }

  const kycCredential = didDocument.credentials.find((c) =>
    c.type.includes('KYCCredential')
  )

  return {
    hasKYC: !!kycCredential,
    verified: didDocument.verified,
    did: didDocument.did,
    expirationDate: kycCredential?.expirationDate || null,
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function simpleHash(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).padStart(20, '0')
}

function mockSignature(data: string): string {
  return `sig-${simpleHash(data)}-${Date.now().toString(36)}`
}

/**
 * Create a presentable DID for UI (shortened)
 */
export function formatDID(did: string): string {
  if (did.length <= 30) return did
  return `${did.slice(0, 20)}...${did.slice(-10)}`
}

/**
 * Export DID document as JSON (for backup/sharing)
 */
export function exportDID(didDocument: DIDDocument): string {
  return JSON.stringify(didDocument, null, 2)
}

/**
 * Import DID document from JSON
 */
export function importDID(jsonString: string, walletAddress: string): DIDDocument {
  const didDocument = JSON.parse(jsonString)

  // Validate structure
  if (!didDocument.did || !didDocument.publicKey) {
    throw new Error('Invalid DID document structure')
  }

  // Store in browser
  storeDID(walletAddress, didDocument)

  return didDocument
}
