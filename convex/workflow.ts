import { WorkflowManager } from "@convex-dev/workflow";
import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

// Define your workflow states and transitions here
// This is a basic example - adjust according to your needs

export const workflow = new WorkflowManager({
  // Define your workflow states and transitions
  // Example:
  // states: {
  //   draft: {},
  //   inReview: {},
  //   published: {}
  // },
  // transitions: {
  //   submit: { from: ["draft"], to: "inReview" },
  //   publish: { from: ["inReview"], to: "published" },
  //   reject: { from: ["inReview"], to: "draft" }
  // }
});

export default workflow;
