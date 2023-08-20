/*
 * This function is triggered by changes to a Firestore document.
 * It will write a new document to a subcollection with the changes.
 * It will also write a new document to a subcollection when a document is deleted.
 * The subcollection name is configurable via the `CHANGED_SUBCOLLECTION_NAME` environment variable.
 * The collection name is configurable via the `YOUR_COLLECTION` environment variable.
 * The number of days to keep the deleted document is configurable via the `DELETE_AFTER` environment variable.
 * The default number of days to keep the deleted document is 30 days.
 * The default subcollection name is "historian".
 * The default collection name is "YOUR_COLLECTION".
 *
 */

import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { getChanges } from "./get-changes";
import {
  DocumentSnapshot,
  FieldValue,
  Firestore,
  Timestamp,
} from "firebase-admin/firestore";

let db: Firestore;
let initialized = false;

/**
 * Initializes Admin SDK & SMTP connection if not already initialized.
 */
async function initialize() {
  if (initialized === true) return;
  initialized = true;
  admin.initializeApp();
  db = admin.firestore();
}

function calculateDeleteAfter() {
  let deleteAfterDays = 30;
  try {
    deleteAfterDays = parseInt(process.env.DELETE_AFTER ?? "") ?? 30;
  } catch (_) {
    console.error("DELETE_AFTER is not a number, defaulting to 30 days");
  }
  // Convert today, plus deleteAfterDays, to a Firestore Timestamp
  const deleteAfter = Timestamp.fromDate(
    new Date(Date.now() + deleteAfterDays * 24 * 60 * 60 * 1000)
  );
  return deleteAfter;
}

async function writeDeleted(snapshot: DocumentSnapshot) {
  const docRef = db
    .collection(
      `${snapshot.ref.path}/${
        process.env.CHANGED_SUBCOLLECTION_NAME ?? "historian"
      }`
    )
    .doc("deleted-snapshot");
  const data = snapshot.data();

  if (data) {
    await docRef.set({
      ...data,
      deletedAt: FieldValue.serverTimestamp(),
      deleteAfter: calculateDeleteAfter(),
    });
  }
}

async function writeChange(before: DocumentSnapshot, after: DocumentSnapshot) {
  const docRef = db
    .collection(
      `${after.ref.path}/${
        process.env.CHANGED_SUBCOLLECTION_NAME ?? "historian"
      }`
    )
    .doc(`v${generateVersionId()}`);
  const changes = getChanges(before.data(), after.data());

  if (changes) {
    await docRef.set(
      {
        ...changes,
        updatedAt: FieldValue.serverTimestamp(),
        deleteAfter: calculateDeleteAfter(),
      },
      { merge: true }
    );
  }
  return;
}

export const generateVersionId = () => {
  const now = new Date().toISOString().replace(":", "-").replace(".", "-");
  return now;
};

export const processEvent = functions.firestore
  .document(process.env.YOUR_COLLECTION ?? "")
  .onWrite(async (change: functions.Change<DocumentSnapshot>) => {
    await initialize();
    const { before, after } = change;
    if (!before.exists) {
      return;
    }
    if (!after.exists) {
      await writeDeleted(before);
      return;
    }
    await writeChange(before, after);
    return;
  });
