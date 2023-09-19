import { FieldValue } from "firebase-admin/firestore";
import { db } from ".";

export const undoChange = async (
  documentPath: string,
  historianVersionID: string,
  action: "before" | "after"
) => {
  // Return a timestamp, without any non-numeric characters from the ISO string
  console.info(
    `${
      action === "before" ? "Undoing" : "Redoing"
    } change for document ${documentPath} at version ${historianVersionID}`
  );
  const versionDocument = await db
    .collection(
      `${documentPath}/${process.env.CHANGED_SUBCOLLECTION_NAME ?? "historian"}`
    )
    .doc(historianVersionID)
    .get();
  if (!versionDocument.exists) {
    console.info(
      `Version ${historianVersionID} does not exist for document ${documentPath}`
    );
    await db.doc(documentPath).update({
      [process.env.HISTORIAN_UNDO_FIELD ?? "historianUndo"]:
        FieldValue.delete(),
      [process.env.HISTORIAN_REDO_FIELD ?? "historianRedo"]:
        FieldValue.delete(),
    });
    return;
  }
  const originalDocument = await db.doc(documentPath).get();
  if (!originalDocument.exists) {
    console.info(
      `Document ${documentPath} does not exist. Cannot undo version ${historianVersionID}`
    );
    return;
  }
  const originalData = originalDocument.data();
  const versionData = versionDocument.data();
  if (!originalData || !versionData) {
    console.info(
      `Document ${documentPath} or version ${historianVersionID} is missing data. Cannot undo.`
    );
    return;
  }
  const { rawData } = versionData;
  if (!rawData) {
    console.info(
      `Version ${historianVersionID} is missing rawData. Cannot ${action}.`
    );
    return;
  }
  const changesList: { [key: string]: any } = {};
  for (const key of Object.keys(rawData)) {
    const actionValue = rawData[key][action];
    changesList[`${key}`] = actionValue;
  }
  await db.doc(documentPath).update({
    ...changesList,
    [process.env.HISTORIAN_UNDO_FIELD ?? "historianUndo"]: FieldValue.delete(),
    [process.env.HISTORIAN_REDO_FIELD ?? "historianRedo"]: FieldValue.delete(),
  });
};
