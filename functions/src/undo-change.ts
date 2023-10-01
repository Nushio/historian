import { FieldValue } from "firebase-admin/firestore";
import { db } from ".";
import { info } from "firebase-functions/logger";
/**
 * Undoes or redoes a change for a document at a specific historian version.
 * @param { string } documentPath - The path of the document to undo/redo changes for.
 * @param { string } historianVersionID - The ID of the historian version to undo/redo changes for.
 * @param { 'before' | 'after' } action - The action to perform, either "before" or "after".
 * @return { void } void
 */
export const undoChange = async (
  documentPath: string,
  historianVersionID: string,
  action: "before" | "after"
) => {
  // Return a timestamp, without any non-numeric characters from the ISO string
  info(
    `${
      action === "before" ? "Undoing" : "Redoing"
    } change for document ${documentPath} at version ${historianVersionID}`
  );

  const historianUndoField =
    process.env.HISTORIAN_UNDO_FIELD ?? "historianUndo";
  const historianRedoField =
    process.env.HISTORIAN_REDO_FIELD ?? "historianRedo";
  const subcollectionName =
    process.env.CHANGED_SUBCOLLECTION_NAME ?? "historian";

  const versionDocument = await db
    .collection(`${documentPath}/${subcollectionName}`)
    .doc(historianVersionID)
    .get();
  if (!versionDocument.exists) {
    info(
      `Version ${historianVersionID} does not exist for document ${documentPath}`
    );
    await db.doc(documentPath).update({
      [historianUndoField]: FieldValue.delete(),
      [historianRedoField]: FieldValue.delete(),
    });
    return;
  }
  const originalDocument = await db.doc(documentPath).get();
  if (!originalDocument.exists) {
    info(
      `Document ${documentPath} does not exist. Cannot undo version ${historianVersionID}`
    );
    return;
  }
  const originalData = originalDocument.data();
  const versionData = versionDocument.data();
  if (!originalData || !versionData) {
    info(
      `Document ${documentPath} or version ${historianVersionID} is missing data. Cannot undo.`
    );
    return;
  }
  const { rawData } = versionData;
  if (!rawData) {
    info(`Version ${historianVersionID} is missing rawData. Cannot ${action}.`);
    return;
  }
  const changesList: { [key: string]: unknown } = {};
  for (const key of Object.keys(rawData)) {
    const actionValue = rawData[key][action];
    changesList[`${key}`] = actionValue;
  }

  await db.doc(documentPath).update({
    ...changesList,
    [historianUndoField]: FieldValue.delete(),
    [historianRedoField]: FieldValue.delete(),
  });
};
