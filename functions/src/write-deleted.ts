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
  const deletedSnapshot = {
    ...data,
    deletedAt: FieldValue.serverTimestamp(),
  } as any;
  const deleteAfter = calculateDeleteAfter();
  if (deleteAfter) {
    deletedSnapshot["deleteAfter"] = deleteAfter;
  }
  if (data) {
    await docRef.set(deletedSnapshot);
  }
}
