import { writeDeleted } from "./write-deleted";
import { expect } from "chai";
import {
  DocumentData,
  DocumentSnapshot,
  FieldValue,
} from "firebase-admin/firestore";
import * as calculateDeleteAfter from "./calculate-deleted-after";
import * as historianIndex from ".";
import * as sinon from "sinon";

describe("writeDeleted", () => {
  // Create a mock DocumentSnapshot object
  const snapshot = {
    ref: {
      path: "collection/document",
    },
    data: () => {
      return { some: "data" };
    },
  } as unknown as DocumentSnapshot<DocumentData>;

  const collectionStub = sinon.stub();
  const docStub = sinon.stub();
  const setStub = sinon.stub();

  const calculateDeleteAfterStub = sinon.stub();
  before(() => {
    sinon
      .stub(calculateDeleteAfter, "calculateDeleteAfter")
      .value(calculateDeleteAfterStub);

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
  });

  it("should write a snapshot of a deleted document to Firestore", async () => {
    // Call the writeDeleted function
    await writeDeleted(snapshot as unknown as DocumentSnapshot<DocumentData>);

    expect(collectionStub.calledOnce).to.be.true;
    expect(collectionStub.calledWith("collection/document/historian")).to.be
      .true;
    expect(docStub.calledOnce).to.be.true;
    expect(docStub.calledWith("deleted-snapshot")).to.be.true;
    expect(setStub.calledOnce).to.be.true;
    expect(
      setStub.calledWith({
        some: "data",
        deletedAt: 1234567890,
        deleteAfter: 987654321,
      })
    ).to.be.true;
  });

  it("should not write a snapshot if the document has no data", async () => {
    // Call the writeDeleted function
    const tmpSnapshot = {
      ...snapshot,
      data: () => {
        return undefined;
      },
    } as unknown as DocumentSnapshot<DocumentData>;
    await writeDeleted(
      tmpSnapshot as unknown as DocumentSnapshot<DocumentData>
    );

    expect(collectionStub.calledOnce).to.not.be.true;
  });

  it("should set the deleteAfter field if it is defined", async () => {
    // Call the writeDeleted function

    await writeDeleted(snapshot as unknown as DocumentSnapshot<DocumentData>);
    expect(calculateDeleteAfterStub.calledOnce).to.be.true;
    expect(
      setStub.calledWith({
        some: "data",
        deletedAt: 1234567890,
        deleteAfter: 987654321,
      })
    ).to.be.true;
  });

  it("should not set the deleteAfter field if it is undefined", async () => {
    // Call the writeDeleted function
    sinon.replace(calculateDeleteAfter, "calculateDeleteAfter", () => null);
    await writeDeleted(snapshot as unknown as DocumentSnapshot<DocumentData>);
    expect(
      setStub.calledWith({
        some: "data",
        deletedAt: 1234567890,
      })
    ).to.be.true;
  });

  it("should use the default subcollection name if the environment variable is not set", async () => {
    // Mock the environment variable to be undefined
    process.env.CHANGED_SUBCOLLECTION_NAME = undefined;

    // Call the writeDeleted function
    await writeDeleted(snapshot as unknown as DocumentSnapshot<DocumentData>);
    expect(collectionStub.calledWith("collection/document/historian")).to.be
      .true;
  });

  it("should use the custom subcollection name if the environment variable is set", async () => {
    // Mock the environment variable to be a custom value
    process.env.CHANGED_SUBCOLLECTION_NAME = "custom";

    // Call the writeDeleted function
    await writeDeleted(snapshot as unknown as DocumentSnapshot<DocumentData>);
    expect(collectionStub.calledWith("collection/document/custom")).to.be.true;
  });
});
