import { Application, Request, Response } from 'express';
import { HealthStatusController } from './lib/controllers';

enum RestVerb {
  show = 'get',
}

type ActionType = (request: Request, response: Response) => void;

class Route {
  path: string;

  action: ActionType;

  verb: RestVerb;

  constructor(
    verb: RestVerb,
    path: string,
    action: ActionType,
  ) {
    this.path = path;
    this.action = action;
    this.verb = verb;
  }
}

export class Routes {
  private app: Application;

  routes: Array<Route> = [];

  private controllers = {
    healthStatusController: new HealthStatusController(),
  };

  constructor(app: Application) {
    this.app = app;
  }

  static call(app: Application) {
    const instance = new Routes(app);
    instance.call();
  }

  call() {
    this.routes.push(
      new Route(
        RestVerb.show,
        '/api/v1/status(||/0)',
        this.controllers.healthStatusController.show,
      ),
    );
    this.routes.push(
      new Route(
        RestVerb.show,
        '/api/v1/status/1',
        this.controllers.healthStatusController.show1,
      ),
    );
    this.routes.forEach((route) => {
      this.app[route.verb](route.path, route.action);
    });
  }
}
