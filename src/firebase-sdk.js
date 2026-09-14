const FIREBASE_VERSION = '12.19.0';
const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;

let sdkPromise = null;

/*
 Firebase Console:
 Project Settings → General → Your apps → Config
 bo‘limidagi qiymatlarni quyidagi joylarga kiriting.
*/
export const firebaseConfig = {
  apiKey: 'AIzaSyCZG3oGYGNR2U3oRerzPewMCVryyMwdh0A',
  authDomain: 'sinfquiz-c8522.firebaseapp.com',
  projectId: 'sinfquiz-c8522',
  storageBucket: 'sinfquiz-c8522.firebasestorage.app',
  messagingSenderId: '1060458952701',
  appId: '1:1060458952701:web:55f69da8e8f165e15f0b94',
};

const ADMIN_EMAIL = 'admin@sinfquiz.uz';

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function firebaseReady() {
  return Object.values(firebaseConfig).every(hasValue) &&
    hasValue(ADMIN_EMAIL);
}

export function adminEmail() {
  return ADMIN_EMAIL;
}

export async function getFirebase() {
  if (!firebaseReady()) {
    throw new Error(
      'Firebase konfiguratsiyasi to‘liq kiritilmagan.'
    );
  }

  if (!sdkPromise) {
    sdkPromise = Promise.all([
      import(/* @vite-ignore */ `${base}/firebase-app.js`),
      import(/* @vite-ignore */ `${base}/firebase-auth.js`),
      import(/* @vite-ignore */ `${base}/firebase-firestore.js`),
    ])
      .then(([appSdk, authSdk, storeSdk]) => {
        const app = appSdk.getApps().length
          ? appSdk.getApp()
          : appSdk.initializeApp(firebaseConfig);

        return {
          ...authSdk,
          ...storeSdk,
          app,
          auth: authSdk.getAuth(app),
          db: storeSdk.getFirestore(app),
        };
      })
      .catch((error) => {
        sdkPromise = null;
        throw error;
      });
  }

  return sdkPromise;
}

export async function waitForAuth() {
  const sdk = await getFirebase();

  await new Promise((resolve) => {
    const stop = sdk.onAuthStateChanged(sdk.auth, () => {
      stop();
      resolve();
    });
  });

  return sdk;
}

export async function ensureAnonymous() {
  const sdk = await waitForAuth();

  if (!sdk.auth.currentUser) {
    await sdk.signInAnonymously(sdk.auth);
  }

  return sdk;
}