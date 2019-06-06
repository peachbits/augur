import { Logger, LoggerInterface } from "./logger/logger";

describe("utils/logger", () => {
  class ExampleLogger implements LoggerInterface {
    error(...err: Array<string | Error>) {
    }

    warn(...msg: string[]) {
    }

    info(...msg: string[]) {
    }

    debug(...msg: string[]) {
    }
  }

  ["error", "info", "warn", "debug"].map((method: keyof LoggerInterface) => {
    const exampleLogger = new ExampleLogger();
    const spy = jest.spyOn<LoggerInterface, keyof LoggerInterface>(exampleLogger, method);

    const exampleMsg = "Some example message";

    const logger = new Logger();
    logger.addLogger(exampleLogger);

    describe(`${method} method`, () => {
      test(`should call the ${method} method of passed logger`, () => {
        logger[method].call(logger, exampleMsg);
        expect(spy).toHaveBeenCalledWith(exampleMsg);
      });
    });
  });
});
