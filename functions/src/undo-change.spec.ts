import * as sinon from "sinon";
import { expect } from "chai";
import { undoChange } from "./undo-change";
import * as historianIndex from ".";
import { FieldValue } from "firebase-admin/firestore";
describe("undoChange", () => {
  const collectionStub = sinon.stub();
  const docStub = sinon.stub();

  const getStub = sinon.stub();
  const updateStub = sinon.stub();
  // let deleteStub: sinon.SinonStub;

  before(() => {
    process.env.CHANGED_SUBCOLLECTION_NAME = "historian";
    sinon.stub(historianIndex, "db").value({
      collection: collectionStub,
      doc: docStub,
    } as unknown as FirebaseFirestore.Firestore);
    sinon.stub(FieldValue, "delete").value(() => {
      return "deleted";
    });
  });
  beforeEach(() => {
    collectionStub.returns({
      doc: docStub,
    });

    docStub.returns({
      get: getStub,
      update: updateStub,
    });

    // Set up the mock responses for Firestore
    getStub.resolves({
      exists: true,
      data: sinon.stub().returns({
        foo: "bar",
        rawData: {
          foo: { before: "bar", after: "baz" },
        },
      }),
    });
    updateStub.returns(Promise.resolve());
  });

  after(() => {
    sinon.restore();
  });

  afterEach(() => {
    collectionStub.reset();
    docStub.reset();
    getStub.reset();
    updateStub.reset();
  });

  it("should undo changes for a document at a specific historian version", async () => {
    const documentPath = "test/doc";
    const historianVersionID = "123";
    const action = "before";

    // Call the undoChange function
    await undoChange(documentPath, historianVersionID, action);

    // Assert that the Firestore methods were called correctly
    console.log("collectionStub", collectionStub.args[0]);
    expect(collectionStub.calledWith("test/doc/historian")).to.have.been.true;
    expect(docStub.calledWith("123")).to.have.been.true;
    expect(getStub.calledTwice).to.have.been.true;

    expect(
      updateStub.calledOnceWithExactly({
        foo: "bar",
        historianUndo: "deleted",
        historianRedo: "deleted",
      })
    ).to.have.been.true;
  });

  it("should redo changes for a document at a specific historian version", async () => {
    const documentPath = "test/doc";
    const historianVersionID = "123";
    const action = "after";

    // Call the undoChange function
    await undoChange(documentPath, historianVersionID, action);

    // Assert that the Firestore methods were called correctly
    expect(collectionStub.calledWith("test/doc/historian")).to.have.been.true;
    expect(docStub.calledWith("123")).to.have.been.true;
    expect(getStub.calledTwice).to.have.been.true;
    expect(
      updateStub.calledOnceWithExactly({
        foo: "baz",
        historianUndo: "deleted",
        historianRedo: "deleted",
      })
    ).to.have.been.true;
  });
});
