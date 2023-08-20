Use this extension to store changes of your Firestore documents in a separate subcollection.

When configured with Firestore TTL, this extension can be used to implement a document history feature, that automatically deletes old document changes.

# Billing

This extension uses other Firebase or Google Cloud Platform services which may have associated charges:

- Cloud Functions

When you use Firebase Extensions, you're only charged for the underlying resources that you use. A paid-tier billing plan is only required if the extension uses a service that requires a paid-tier plan, for example calling to a Google Cloud Platform API or making outbound network requests to non-Google services. All Firebase services offer a free tier of usage. [Learn more about Firebase billing.](https://firebase.google.com/pricing)

- Cloud Firestore

The pricing for Cloud Firestore is based on usage. After you exceed the [free tier limits](https://firebase.google.com/pricing#cloud-firestore), you are charged for the data you store, the database operations you perform, and the bandwidth you use. [Learn more about Cloud Firestore pricing](https://firebase.google.com/pricing#cloud-firestore).