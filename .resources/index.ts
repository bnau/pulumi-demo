import {Output} from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";
import * as docker from "@pulumi/docker";
import * as pulumi from "@pulumi/pulumi";
import * as path from "node:path";

const dbUser = new pulumi.Config().get("dbUser")
const dbPassword = new pulumi.Config().getSecret("dbPassword")
const dbName = "demo";

function bdd(): Output<string> {
    const namespace = new kubernetes.core.v1.Namespace("app", {
            metadata: {
                name: "demo",
            }
        });

        const pgChart = new kubernetes.helm.v3.Chart("postgres", {
                namespace: "demo",
                chart: "postgresql",
                fetchOpts: {
                    repo: "https://charts.bitnami.com/bitnami",
                },
                values: {
                    auth: {
                        username: dbUser,
                        password: dbPassword,
                        postgresPassword: dbPassword,
                        database: dbName,
                    }

                },
            }, {dependsOn: namespace});

        return pgChart.getResourceProperty("v1/Service", `demo/postgres-postgresql`, "metadata").name;
}

const dbHost = bdd()

function app(dbHost: Output<string>): Output<string> {
    const appLabels = {
            app: "nginx",
        };
        const image = new docker.Image("my-image", {
            build: {
                context: path.join(__dirname, "backend"),
            },
            imageName: "pulumi-demo",
            skipPush: true,
        }, {parent: this});

        const deployment = new kubernetes.apps.v1.Deployment("app", {
            metadata: {
                namespace: "demo",
            },
            spec: {
                selector: {
                    matchLabels: appLabels,
                },
                replicas: 1,
                template: {
                    metadata: {
                        labels: appLabels,
                    },
                    spec: {
                        containers: [{
                            image: image.imageName,
                            name: "pulumi-demo",
                            imagePullPolicy: "Never",
                            env: [
                                {
                                    name: "DB_USER",
                                    value: dbUser,
                                },
                                {
                                    name: "DB_PASSWORD",
                                    value: dbPassword,
                                },
                                {
                                    name: "DB_HOST",
                                    value: dbHost,
                                },
                                {
                                    name: "DB_NAME",
                                    value: dbName,
                                },
                            ],
                        }],
                    },
                },
            },
        }, {parent: this});

        const service = new kubernetes.core.v1.Service("app", {
            metadata: {
                namespace: "demo",
            },
            spec: {
                ports: [{
                    port: 80,
                    targetPort: 8080,
                    protocol: "TCP",
                }],
                type: "LoadBalancer",
                selector: appLabels,
            },
        }, {dependsOn: [deployment], parent: this});

        return pulumi.all([service.status, service.spec])
            .apply(([status, spec]) =>
                `http://${status.loadBalancer.ingress[0].hostname}:${spec.ports[0].port}`)}

export const url = app(dbHost);
