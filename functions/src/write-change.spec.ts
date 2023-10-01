import { writeChange } from "./write-change";
import { expect } from "chai";
import {
  DocumentData,
  DocumentSnapshot,
  FieldValue,
} from "firebase-admin/firestore";
import * as calculateDeleteAfter from "./calculate-deleted-after";
import * as historianIndex from ".";
import * as undoChange from "./undo-change";
import * as getChanges from "./get-changes";
import * as generateVersionId from "./generate-version-id";
import * as sinon from "sinon";

describe("writeChange", () => {
  // Create a mock DocumentSnapshot object
  const beforeSnapshot = {
    ref: {
      path: "collection/document",
    },
    data: () => {
      return { some: "beforedata" };
    },
  } as unknown as DocumentSnapshot<DocumentData>;
  // Create a mock DocumentSnapshot object
  const afterSnapshot = {
    ref: {
      path: "collection/document",
    },
    data: () => {
      return { some: "afterdata" };
    },
  } as unknown as DocumentSnapshot<DocumentData>;

  const collectionStub = sinon.stub();
  const docStub = sinon.stub();
  const setStub = sinon.stub();

  const calculateDeleteAfterStub = sinon.stub();
  const getChangesStub = sinon.stub();
  const undoChangeStub = sinon.stub();
  const generateVersionIdStub = sinon.stub();
  before(async () => {
    sinon
      .stub(calculateDeleteAfter, "calculateDeleteAfter")
      .value(calculateDeleteAfterStub);

    sinon.stub(getChanges, "getChanges").value(getChangesStub);

    sinon.stub(undoChange, "undoChange").value(undoChangeStub);

    sinon
      .stub(generateVersionId, "generateVersionId")
      .value(generateVersionIdStub);

    sinon.stub(historianIndex, "db").value({
      collection: collectionStub,
    } as unknown as FirebaseFirestore.Firestore);

    // stub the serverTimestamp function
    sinon.stub(FieldValue, "serverTimestamp").value(() => {
      return 1234567890;
    });
  });

  beforeEach(() => {
    process.env.CHANGED_SUBCOLLECTION_NAME = "historian";
    // stub the calculateDeleteAfter function
    calculateDeleteAfterStub.returns(987654321);
    generateVersionIdStub.returns("12345");
    getChangesStub.returns({
      changes: {
        foo: {
          before: "bar",
          after: "baz",
        },
      },
    });
    undoChangeStub.returns(Promise.resolve());
    collectionStub.returns({
      doc: docStub,
    });

    docStub.returns({
      set: setStub,
    });
    setStub.returns(Promise.resolve());
  });
  after(() => {
    sinon.restore();
  });
  afterEach(() => {
    collectionStub.reset();
    docStub.reset();
    setStub.reset();
    calculateDeleteAfterStub.reset();
    getChangesStub.reset();
    undoChangeStub.reset();
    generateVersionIdStub.reset();
  });

  it("should write a snapshot of a changed document to Firestore", async () => {
    // Call the writeChange function
    await writeChange(
      beforeSnapshot as DocumentSnapshot<DocumentData>,
      afterSnapshot as DocumentSnapshot<DocumentData>
    );

    expect(collectionStub.calledOnce).to.be.true;
    expect(collectionStub.calledWith("collection/document/historian")).to.be
      .true;
    expect(docStub.calledOnce).to.be.true;
    expect(docStub.calledWith("v12345")).to.be.true;
    expect(setStub.calledOnce).to.be.true;
    expect(
      setStub.calledWith({
        changes: {
          foo: {
            before: "bar",
            after: "baz",
          },
        },
        createdAt: 1234567890,
        deleteAfter: 987654321,
      })
    ).to.be.true;
  });
});
