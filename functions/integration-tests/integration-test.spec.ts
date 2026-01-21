import { expect } from "chai";
import { describe, it, before } from "mocha";
import * as admin from "firebase-admin";

describe("integration-tests", () => {
  const projectId = "demo-test";
  let firestore: FirebaseFirestore.Firestore;
  let currentDocId: string | null = null;

  /**
   * Helper function to poll for documents in the historian subcollection
   * Retries up to maxAttempts with a delay between attempts
   */
  async function getHistorianDocs(
    docId: string,
    expectedCount: number,
    maxAttempts = 10,
    delayMs = 300,
  ): Promise<FirebaseFirestore.QuerySnapshot> {
    for (let i = 0; i < maxAttempts; i++) {
      const changes = await firestore
        .collection(`users/${docId}/historian`)
        .get();
      if (changes.docs.length >= expectedCount) {
        return changes;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    throw new Error(`Timeout waiting for ${expectedCount} historian documents`);
  }

  /**
   * Helper to clean up both the document and its historian subcollection
   */
  async function cleanupDocument(docId: string) {
    // Delete all historian documents
    const historianDocs = await firestore
      .collection(`users/${docId}/historian`)
      .get();
    for (const doc of historianDocs.docs) {
      await doc.ref.delete();
    }
    // Delete the main document
    await firestore.collection("users").doc(docId).delete();
    // Delete the deleted snapshot document
    await firestore
      .collection(`users/${docId}/historian`)
      .doc("deleted-snapshot")
      .delete();
  }

  before(async () => {
    admin.initializeApp({ projectId });
    firestore = admin.firestore();
  });

  afterEach(async () => {
    if (currentDocId) {
      await cleanupDocument(currentDocId);
      currentDocId = null;
    }
  });

  it("should create a document with changes", async () => {
    currentDocId = "test-changes";

    await firestore.collection("users").doc(currentDocId).set({
      first: "Ada",
      last: "Lovelace",
      born: 1800,
    });
    await firestore
      .collection("users")
      .doc(currentDocId)
      .update({ born: 1815 });

    const changes = await getHistorianDocs(currentDocId, 1);
    expect(changes.docs.length).to.eql(1);
  }).timeout(10000);

  it("should create a document with changes when a subcollection is updated", async () => {
    currentDocId = "test-subcollection";

    await firestore.collection("users").doc(currentDocId).set({
      first: "Ada",
      last: "Lovelace",
      born: 1800,
    });
    await firestore
      .collection("users")
      .doc(currentDocId)
      .update({ born: 1815 });

    const changes = await getHistorianDocs(currentDocId, 1);
    const changedData = changes.docs[0].data();
    expect(changedData.changes["born"]).to.eql({
      before: 1800,
      after: 1815,
    });
  }).timeout(10000);

  it("should create a single document when multiple fields are updated", async () => {
    currentDocId = "test-multiple-fields";

    await firestore.collection("users").doc(currentDocId).set({
      first: "Ada",
      last: "Lovelace",
      born: 1815,
    });
    await firestore
      .collection("users")
      .doc(currentDocId)
      .update({ first: "Augusta", last: "Byron" });

    const changes = await getHistorianDocs(currentDocId, 1);
    expect(changes.docs.length).to.eql(1);
  }).timeout(10000);

  it("should create multiple documents when multiple writes are performed", async () => {
    currentDocId = "test-multiple-writes";

    await firestore.collection("users").doc(currentDocId).set({
      first: "Ada",
      last: "Lovelace",
      born: 1800,
    });
    await firestore
      .collection("users")
      .doc(currentDocId)
      .update({ first: "Augusta", last: "Byron" });
    await firestore
      .collection("users")
      .doc(currentDocId)
      .update({ born: 1815 });

    const changes = await getHistorianDocs(currentDocId, 2);
    expect(changes.docs.length).to.eql(2);
  }).timeout(10000);

  it("should create a document with deleteAfter", async () => {
    currentDocId = "test-delete-after";

    await firestore.collection("users").doc(currentDocId).set({
      first: "Ada",
      last: "Lovelace",
      born: 1800,
    });
    await firestore
      .collection("users")
      .doc(currentDocId)
      .update({ born: 1815 });

    const changes = await getHistorianDocs(currentDocId, 1);
    const changedData = changes.docs[0].data();
    expect(changedData.deleteAfter).to.exist;
  }).timeout(10000);

  it("should create a document with createdAt", async () => {
    currentDocId = "test-created-at";

    await firestore.collection("users").doc(currentDocId).set({
      first: "Ada",
      last: "Lovelace",
      born: 1800,
    });
    await firestore
      .collection("users")
      .doc(currentDocId)
      .update({ born: 1815 });

    const changes = await getHistorianDocs(currentDocId, 1);
    const changedData = changes.docs[0].data();
    expect(changedData.createdAt).to.exist;
  }).timeout(10000);

  it("should ignore document changes when an excluded field is updated", async () => {
    currentDocId = "test-excluded-fields";

    await firestore.collection("users").doc(currentDocId).set({
      first: "Ada",
      last: "Lovelace",
      born: 1800,
    });

    // Update only excluded fields - should not create historian documents
    await firestore
      .collection("users")
      .doc(currentDocId)
      .update({ excludeMe: "please" });
    await firestore
      .collection("users")
      .doc(currentDocId)
      .update({ excludeMe: "onegaishimasu" });
    await firestore
      .collection("users")
      .doc(currentDocId)
      .update({ excludeMe: "por favor" });

    // Give functions time to process, then verify no historian docs were created
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const changes = await firestore
      .collection(`users/${currentDocId}/historian`)
      .get();
    expect(changes.docs.length).to.eql(0);
  }).timeout(10000);

  it("should create a document snapshot when the document is deleted", async () => {
    currentDocId = "test-deletion";

    await firestore.collection("users").doc(currentDocId).set({
      first: "Ada",
      last: "Lovelace",
      born: 1815,
    });
    await firestore.collection("users").doc(currentDocId).delete();

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const deletedSnapshot = await firestore
      .collection(`users/${currentDocId}/historian`)
      .doc("deleted-snapshot")
      .get();
    expect(deletedSnapshot.exists).to.eql(true);
  }).timeout(10000);
});
