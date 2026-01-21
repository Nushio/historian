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

import { DocumentSnapshot } from "firebase-admin/firestore";
// Use Functions v1 as firestore extensions don't support v2 yet :-(
import { firestore, Change } from "firebase-functions/v1";
import { writeDeleted } from "./write-deleted";
import { writeChange } from "./write-change";
import { initialize } from "./init";

/**
 * Listens for changes to a Firestore collection and writes them to a separate database.
 * @returns A Cloud Function that triggers on write events to the specified collection.
 */
export const processEvent = firestore
  .document(process.env.YOUR_COLLECTION ?? "")
  .onWrite(async (change: Change<DocumentSnapshot>) => {
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
