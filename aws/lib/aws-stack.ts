import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as ecs_patterns from "@aws-cdk/aws-ecs-patterns";
import * as path from "path";

export class AwsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "flakebot-vpc", {
      maxAzs: 2,
    });

    const cluster = new ecs.Cluster(this, "flakebot-cluster", {
      vpc: vpc,
    });

    // Create a load-balanced Fargate service and make it public
    const service = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      "flakebot-service",
      {
        cluster: cluster, // Required
        cpu: 512, // Default is 256
        desiredCount: 6, // Default is 1
        taskImageOptions: {
          image: ecs.ContainerImage.fromRegistry("kclejeune/flakebot:latest"),
        },
        memoryLimitMiB: 2048, // Default is 512
        publicLoadBalancer: true, // Default is false
      }
    );

    // Setup AutoScaling policy
    const AUTOSCALE_COOLDOWN_SECONDS = 60;
    const AUTOSCALE_TARGET_PERCENT = 85;

    const scaling = service.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 10,
    });
    scaling.scaleOnCpuUtilization("flakebot-cpu-scaling", {
      targetUtilizationPercent: AUTOSCALE_TARGET_PERCENT,
      scaleInCooldown: cdk.Duration.seconds(AUTOSCALE_COOLDOWN_SECONDS),
      scaleOutCooldown: cdk.Duration.seconds(AUTOSCALE_COOLDOWN_SECONDS),
    });
  }
}
