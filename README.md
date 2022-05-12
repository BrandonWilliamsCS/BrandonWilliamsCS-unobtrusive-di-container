# Unobtrusive DI Container

This library seeks to support unobtrusive DI in TypeScript (especially in React) through simple registration and access APIs.

## Motivation

Languages like C# support automatic, unobtrusive dependency injection frameworks due to a combination of strong typing and reflection. It's automatic because the framework resolves and injects dependencies without requiring (much) manual instruction and unobtrusive since the set of dependencies can be determined through static analysis of the dependent code — with no need to pollute either the dependent or dependency code with injection-related concerns.

Unfortunately, JavaScript (and TypeScript, without specialized pre-compile analysis and code generation) lacks that ability to have dependency injection that is both automatic and unobtrusive. Automatic DI can be achieved by marking or transforming dependents and dependencies, but at the cost of mixing injection-related code into an otherwise clean codebase. Unobtrusive dependency injection, then, requires developers to manually instruct a DI container which dependencies to resolve as needed.

## Overview

### Access

Access to dependencies is provided by a `DependencyRegistry` instance via the `resolveDependency` method. The registry will find or create the dependency associated with the provided key, or throw an `Error` if none has been registered.

The `resolveOptionalDependency` method returns `undefined` instead of throwing when a requested dependency is unregistered.

### Registration

Dependency registration is handled by `DependencyRegistrar`s, either by providing a static value to `registerInstance` or a factory function to `registerFactory`. Dependency factories are given a registry that allows them to access sub-dependencies (such as a logger that a query service uses to report errors). Instantiate the `DependencyRegistryBuilder` class for a `DependencyRegistrar` that can produce a `DependencyRegistry`.

Dependencies registered as transient will be re-generated via their factory for every access. Each non-transient registration will call its factory function at most one time, upon first access.

### Dependency Maps

Dependency maps are types that associate associates each dependency's key to its ultimate type. A "dependency map" type can be provided as a type argument to `DependencyRegistry`s and `DependencyRegistrar`s in order to properly type the dependencies that will be registered. Note that these types are not enforced, but are only provided as a convenience.

### React

The `DependencyProvider` component and the `useDependency` hook work together to provide simpler access patterns within a React tree.

When given a `registerDependencies` prop function that registers each dependency with the given registrar, the `DependencyProvider` will make the resulting registry available to its children.

Calling `useDependency` with a dependency key will resolve and return the associated dependency from the registry or registries defined in the `DependencyProvider`s above it. It will first check the nearest provider and fall back to each provider in turn until the dependency is resolved or the end is reached.

## Remarks

Be careful when accessing other dependencies through the registry within a dependency factory; cyclical dependencies or dependency from non-transient to transient will generally cause problems. Good discipline around dependency graphs is not enforced, but rather is the duty of the consumer.
