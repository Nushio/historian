import { DocumentSnapshot, FieldValue } from "firebase-admin/firestore";
import { generateVersionId } from "./generate-version-id";
import { getChanges } from "./get-changes";
import { calculateDeleteAfter } from "./calculate-deleted-after";
import { db } from ".";

export async function writeChange(
  before: DocumentSnapshot,
  after: DocumentSnapshot
) {
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
