import { act, renderHook } from "@testing-library/react-hooks";
import React from "react";
import {
  DependencyProvider,
  DependencyProviderProps,
  useDependency,
} from "./react";

interface DependencyMap {
  key: string;
}

interface CompoundDependencyMap extends DependencyMap {
  compoundKey: string;
}

describe("useDependency", () => {
  it("throws when dependency was never registered", () => {
    // Arrange
    // Act
    const { result } = renderHook(() => useDependency<DependencyMap>("key"));
    // Assert
    expect(result.error).toBeDefined();
  });
  it("returns registered dependency instance", () => {
    // Arrange
    const dependency = "dependency";
    const registerDependencies: DependencyProviderProps<DependencyMap>["registerDependencies"] =
      (registrar) => {
        registrar.registerInstance("key", dependency);
      };
    // Act
    const { result } = renderHook(() => useDependency("key"), {
      wrapper: ({ children }) => (
        <DependencyProvider registerDependencies={registerDependencies}>
          {children}
        </DependencyProvider>
      ),
    });
    // Assert
    expect(result.current).toBe(dependency);
  });
  it("returns registered dependency from factory", () => {
    // Arrange
    const dependency = "dependency";
    const registerDependencies: DependencyProviderProps<DependencyMap>["registerDependencies"] =
      (registrar) => {
        registrar.registerFactory("key", () => dependency);
      };
    // Act
    const { result } = renderHook(() => useDependency("key"), {
      wrapper: ({ children }) => (
        <DependencyProvider registerDependencies={registerDependencies}>
          {children}
        </DependencyProvider>
      ),
    });
    // Assert
    expect(result.current).toBe(dependency);
  });
  it("supports compound dependency factory access", () => {
    // Arrange
    const dependency = "dependency";
    const registerDependencies: DependencyProviderProps<CompoundDependencyMap>["registerDependencies"] =
      (registrar) => {
        registrar.registerFactory("key", () => dependency);
        registrar.registerFactory(
          "compoundKey",
          (registry) => `compound-${registry.resolveDependency("key")}`,
        );
      };
    // Act
    const { result } = renderHook(() => useDependency("compoundKey"), {
      wrapper: ({ children }) => (
        <DependencyProvider registerDependencies={registerDependencies}>
          {children}
        </DependencyProvider>
      ),
    });
    // Assert
    expect(result.current).toBe("compound-dependency");
  });
  it("calls factory only once despite two calls", () => {
    // Arrange
    const dependency = "dependency";
    const factory = jest.fn().mockReturnValue(dependency);
    const registerDependencies: DependencyProviderProps<DependencyMap>["registerDependencies"] =
      (registrar) => {
        registrar.registerFactory("key", factory);
      };
    // Act
    const { result } = renderHook(
      () => {
        useDependency("key");
        useDependency("key");
      },
      {
        wrapper: ({ children }) => (
          <DependencyProvider registerDependencies={registerDependencies}>
            {children}
          </DependencyProvider>
        ),
      },
    );
    // Assert
    expect(factory).toHaveBeenCalledTimes(1);
  });
  it("calls factory once per call for transient dependency", () => {
    // Arrange
    const dependency = "dependency";
    const factory = jest.fn().mockReturnValue(dependency);
    const registerDependencies: DependencyProviderProps<DependencyMap>["registerDependencies"] =
      (registrar) => {
        registrar.registerFactory("key", factory, true);
      };
    // Act
    const { result } = renderHook(
      () => {
        useDependency("key");
        useDependency("key");
      },
      {
        wrapper: ({ children }) => (
          <DependencyProvider registerDependencies={registerDependencies}>
            {children}
          </DependencyProvider>
        ),
      },
    );
    // Assert
    expect(factory).toHaveBeenCalledTimes(2);
  });
  it("delegates to parent scope when missing from nearest scope", () => {
    // Arrange
    const dependency = "dependency";
    const registerParentDependencies: DependencyProviderProps<DependencyMap>["registerDependencies"] =
      (registrar) => {
        registrar.registerInstance("key", dependency);
      };
    const registerDependencies: DependencyProviderProps<DependencyMap>["registerDependencies"] =
      (registrar) => {};
    // Act
    const { result } = renderHook(() => useDependency("key"), {
      wrapper: ({ children }) => (
        <DependencyProvider registerDependencies={registerParentDependencies}>
          <DependencyProvider registerDependencies={registerDependencies}>
            {children}
          </DependencyProvider>
        </DependencyProvider>
      ),
    });
    // Assert
    expect(result.current).toBe(dependency);
  });
  it("ignores parent registrations when resolving from nearer scope", () => {
    // Arrange
    const dependency = "dependency";
    const parentfactory = jest.fn().mockReturnValue(dependency);
    const registerParentDependencies: DependencyProviderProps<DependencyMap>["registerDependencies"] =
      (registrar) => {
        registrar.registerFactory("key", parentfactory);
      };
    const factory = jest.fn().mockReturnValue(dependency);
    const registerDependencies: DependencyProviderProps<DependencyMap>["registerDependencies"] =
      (registrar) => {
        registrar.registerFactory("key", factory);
      };
    // Act
    const { result } = renderHook(() => useDependency("key"), {
      wrapper: ({ children }) => (
        <DependencyProvider registerDependencies={registerParentDependencies}>
          <DependencyProvider registerDependencies={registerDependencies}>
            {children}
          </DependencyProvider>
        </DependencyProvider>
      ),
    });
    // Assert
    expect(parentfactory).not.toHaveBeenCalled();
  });
});
