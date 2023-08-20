import { DocumentSnapshot, FieldValue } from "firebase-admin/firestore";
import { calculateDeleteAfter } from "./calculate-deleted-after";
import { db } from ".";

export async function writeDeleted(snapshot: DocumentSnapshot) {
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
