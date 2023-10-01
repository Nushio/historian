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
import { DocumentSnapshot, Firestore } from "firebase-admin/firestore";
import { writeDeleted } from "./write-deleted";
import { writeChange } from "./write-change";

export let db: Firestore;
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

/**
 * Listens for changes to a Firestore collection and writes them to a separate database.
 * @returns A Cloud Function that triggers on write events to the specified collection.
 */
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
