import { expect } from "chai";
import { describe, it, before } from "mocha";
import * as admin from "firebase-admin";

describe("historian-changes", () => {
  const projectId = "demo-test";
  let firestore: FirebaseFirestore.Firestore;
  before(async () => {
    admin.initializeApp({ projectId });
    firestore = admin.firestore();
    await firestore.collection("users").doc("adalovelace").set({
      first: "Ada",
      last: "Lovelace",
      born: 1800,
    });
    await firestore
      .collection("users")
      .doc("adalovelace")
      .update({ born: 1815 });
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  it("should create a document with changes", async () => {
    const changes = await firestore
      .collection("users/adalovelace/historian")
      .get();
    expect(changes.docs.length).to.eql(1);
  }).timeout(10000);

  it("should create a document with changes when a subcollection is updated", async () => {
    const changes = await firestore
      .collection("users/adalovelace/historian")
      .get();
    const changedData = changes.docs[0].data();
    expect(changedData.changes[0]).to.eql({
      before: 1800,
      after: 1815,
      key: "born",
    });
  }).timeout(10000);

  it("should create a document with deleteAfter", async () => {
    const changes = await firestore
      .collection("users/adalovelace/historian")
      .get();
    const changedData = changes.docs[0].data();
    expect(changedData.deleteAfter).to.exist;
  }).timeout(10000);

  it("should create a document with updatedAt", async () => {
    const changes = await firestore
      .collection("users/adalovelace/historian")
      .get();
    const changedData = changes.docs[0].data();
    expect(changedData.updatedAt).to.exist;
  }).timeout(10000);

  it("should ignore document changes when an excluded field is updated", async () => {
    await firestore
      .collection("users")
      .doc("adalovelace")
      .update({ excludeMe: "please" });
    await firestore
      .collection("users")
      .doc("adalovelace")
      .update({ excludeMe: "onegaishimasu" });
    await firestore
      .collection("users")
      .doc("adalovelace")
      .update({ excludeMe: "por favor" });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const changes = await firestore
      .collection("users/adalovelace/historian")
      .get();
    expect(changes.docs.length).to.eql(1);
  }).timeout(10000);

  it("should create a document snapshot when the document is deleted", async () => {
    await firestore.collection("users").doc("adalovelace").delete();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const deletedSnapshot = await firestore
      .collection("users/adalovelace/historian")
      .doc("deleted-snapshot")
      .get();
    expect(deletedSnapshot.exists).to.eql(true);
  }).timeout(10000);
});
