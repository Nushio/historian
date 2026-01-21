import { expect } from "chai";
import { describe, it, beforeEach, afterEach } from "mocha";
import * as sinon from "sinon";
import { loggerAdapter, logInfo, logWarn, logError } from "./logger";

describe("logger utility", () => {
  let infoStub: sinon.SinonStub;
  let warnStub: sinon.SinonStub;
  let errorStub: sinon.SinonStub;

  beforeEach(() => {
    infoStub = sinon.stub(loggerAdapter, "info");
    warnStub = sinon.stub(loggerAdapter, "warn");
    errorStub = sinon.stub(loggerAdapter, "error");
    delete process.env.LOG_LEVEL;
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should log everything when LOG_LEVEL is INFO (or default)", () => {
    logInfo("info message");
    logWarn("warn message");
    logError("error message");

    expect(infoStub.calledWith("info message")).to.be.true;
    expect(warnStub.calledWith("warn message")).to.be.true;
    expect(errorStub.calledWith("error message")).to.be.true;
  });

  it("should log only warn and error when LOG_LEVEL is WARN", () => {
    process.env.LOG_LEVEL = "WARN";
    logInfo("info message");
    logWarn("warn message");
    logError("error message");

    expect(infoStub.called).to.be.false;
    expect(warnStub.calledWith("warn message")).to.be.true;
    expect(errorStub.calledWith("error message")).to.be.true;
  });

  it("should log only error when LOG_LEVEL is ERROR", () => {
    process.env.LOG_LEVEL = "ERROR";
    logInfo("info message");
    logWarn("warn message");
    logError("error message");

    expect(infoStub.called).to.be.false;
    expect(warnStub.called).to.be.false;
    expect(errorStub.calledWith("error message")).to.be.true;
  });

  it("should log nothing when LOG_LEVEL is SILENT", () => {
    process.env.LOG_LEVEL = "SILENT";
    logInfo("info message");
    logWarn("warn message");
    logError("error message");

    expect(infoStub.called).to.be.false;
    expect(warnStub.called).to.be.false;
    expect(errorStub.called).to.be.false;
  });
});
