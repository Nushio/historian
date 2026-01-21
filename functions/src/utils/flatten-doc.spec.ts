import { expect } from "chai";
import { flattenDoc } from "./flatten-doc";
import { Timestamp } from "firebase-admin/firestore";

describe("flattenDoc", () => {
  it("should flatten a simple object", () => {
    const input = {
      name: "John",
      age: 30,
    };
    const expectedOutput = {
      name: "John",
      age: 30,
    };
    expect(flattenDoc(input)).to.deep.equal(expectedOutput);
  });

  it("should flatten an object with nested objects", () => {
    const input = {
      name: "John",
      address: {
        street: "123 Main St",
        city: "Anytown",
        state: "CA",
      },
    };
    const expectedOutput = {
      name: "John",
      "address.street": "123 Main St",
      "address.city": "Anytown",
      "address.state": "CA",
    };
    expect(flattenDoc(input)).to.deep.equal(expectedOutput);
  });

  it("should flatten an object with nested arrays", () => {
    const input = {
      name: "John",
      hobbies: ["reading", "swimming", "hiking"],
    };
    const expectedOutput = {
      name: "John",
      "hobbies.[0]": "reading",
      "hobbies.[1]": "swimming",
      "hobbies.[2]": "hiking",
    };
    expect(flattenDoc(input)).to.deep.equal(expectedOutput);
  });

  it("should flatten an object with nested arrays and objects", () => {
    const input = {
      name: "John",
      hobbies: [
        {
          name: "reading",
          hoursPerWeek: 5,
        },
        {
          name: "swimming",
          hoursPerWeek: 3,
        },
        {
          name: "hiking",
          hoursPerWeek: 2,
        },
      ],
    };
    const expectedOutput = {
      name: "John",
      "hobbies.[0].name": "reading",
      "hobbies.[0].hoursPerWeek": 5,
      "hobbies.[1].name": "swimming",
      "hobbies.[1].hoursPerWeek": 3,
      "hobbies.[2].name": "hiking",
      "hobbies.[2].hoursPerWeek": 2,
    };
    expect(flattenDoc(input)).to.deep.equal(expectedOutput);
  });

  it("should flatten an object with nested arrays and objects that contain Timestamps", () => {
    const input = {
      name: "John",
      hobbies: [
        {
          name: "reading",
          createdAt: Timestamp.fromDate(new Date("2021-01-01")),
        },
        {
          name: "swimming",
          createdAt: Timestamp.fromDate(new Date("2021-02-01")),
        },
        {
          name: "hiking",
          createdAt: Timestamp.fromDate(new Date("2021-03-01")),
        },
      ],
    };
    const expectedOutput = {
      name: "John",
      "hobbies.[0].name": "reading",
      "hobbies.[0].createdAt": Timestamp.fromDate(new Date("2021-01-01")),
      "hobbies.[1].name": "swimming",
      "hobbies.[1].createdAt": Timestamp.fromDate(new Date("2021-02-01")),
      "hobbies.[2].name": "hiking",
      "hobbies.[2].createdAt": Timestamp.fromDate(new Date("2021-03-01")),
    };
    expect(flattenDoc(input)).to.deep.equal(expectedOutput);
  });
});
