import ttf2eot from "ttf2eot";

const convertTtfToEot = (ttf: Buffer): Buffer => Buffer.from(ttf2eot(ttf));

export default convertTtfToEot;
