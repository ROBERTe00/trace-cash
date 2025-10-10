// WebAuthn utilities for biometric/hardware key authentication

export interface WebAuthnCredential {
  id: string;
  publicKey: string;
  counter: number;
  deviceName?: string;
}

export class WebAuthnService {
  // Check if WebAuthn is supported
  static isSupported(): boolean {
    return window?.PublicKeyCredential !== undefined;
  }

  // Register a new credential (biometric/hardware key)
  static async register(userId: string, userName: string): Promise<WebAuthnCredential | null> {
    if (!this.isSupported()) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'Trace-Cash',
        id: window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(userId),
        name: userName,
        displayName: userName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    };

    try {
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      const response = credential.response as AuthenticatorAttestationResponse;

      return {
        id: credential.id,
        publicKey: btoa(String.fromCharCode(...new Uint8Array(response.getPublicKey()!))),
        counter: 0,
      };
    } catch (error) {
      console.error('WebAuthn registration failed:', error);
      return null;
    }
  }

  // Authenticate using registered credential
  static async authenticate(credentialIds: string[]): Promise<{ credentialId: string; signature: string } | null> {
    if (!this.isSupported()) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials: credentialIds.map(id => ({
        id: Uint8Array.from(atob(id), c => c.charCodeAt(0)),
        type: 'public-key',
      })),
      userVerification: 'required',
      timeout: 60000,
    };

    try {
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      const response = assertion.response as AuthenticatorAssertionResponse;

      return {
        credentialId: assertion.id,
        signature: btoa(String.fromCharCode(...new Uint8Array(response.signature))),
      };
    } catch (error) {
      console.error('WebAuthn authentication failed:', error);
      return null;
    }
  }
}
