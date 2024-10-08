import 'reflect-metadata';

// Annotation for Singleton components
export function Singleton(): ClassDecorator {
	return function (target: any) {
		Reflect.defineMetadata('di:component:scope', 'singleton', target);
	};
}

// Annotation for Prototype components
export function Prototype(): ClassDecorator {
	return function (target: any) {
		Reflect.defineMetadata('di:component:scope', 'prototype', target);
	};
}

// Inject property (Field Injection)
export function Inject(token?: string): PropertyDecorator {
	return function (target: any, propertyKey: string | symbol): void {
		const fields = Reflect.getMetadata('di:inject:fields', target) || [];
		// Use the token provided, or fall back to the type of the property being injected
		const designType = Reflect.getMetadata('design:type', target, propertyKey); // Get the type of the property
		const actualToken = token || designType.name; // Use the property type's name as the token

		fields.push({propertyKey, token: actualToken});
		Reflect.defineMetadata('di:inject:fields', fields, target);
	};
}
// Inject parameter (Constructor Injection)
export function InjectParam(token?: string): ParameterDecorator {
	return function (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number): void {
		// Ensure propertyKey is defined before fetching metadata
		const params = propertyKey !== undefined
			? Reflect.getMetadata('di:inject:params', target, propertyKey) || []
			: [];

		// Ensure that the params array has enough space for the parameter index
		while (params.length <= parameterIndex) {
			params.push(undefined); // Fill the array with undefined until reaching the parameterIndex
		}

		// Assign the token or use the propertyKey as the fallback
		params[parameterIndex] = token || propertyKey?.toString() || '';

		// Define the metadata with the correct target and propertyKey
		if (propertyKey !== undefined) {
			Reflect.defineMetadata('di:inject:params', params, target, propertyKey);
		}
	};
}

// Inject method (Method Injection)
export function InjectMethod(...tokens: string[]): MethodDecorator {
	return function (target: any, propertyKey: string | symbol): void {
		Reflect.defineMetadata('di:inject:method', tokens, target, propertyKey);
	};
}

// Inject value (Configuration Injection)
export function Value(configKey: string): PropertyDecorator {
	return function (target: any, propertyKey: string | symbol): void {
		const fields = Reflect.getMetadata('di:inject:fields', target) || [];
		fields.push({propertyKey, token: configKey});
		Reflect.defineMetadata('di:inject:fields', fields, target);
	};
}

// Dependency Injection container with multiple instances
export class DiContainer {
	private registry = new Map<string, any>();
	private configurations = new Map<string, any>();
	private resolving = new Set<string>(); // Track currently resolving tokens

	// Register a class in this container
	registerClass(classConstructor: any) {
		const token = classConstructor.name;
		const scope = Reflect.getMetadata('di:component:scope', classConstructor) || 'singleton';
		if (!this.registry.has(token)) {
			this.registry.set(token, {classConstructor, isSingleton: scope === 'singleton', instance: null});
		}
	}

	resolve<T>(token: string | (new (...args: any[]) => T)): T {
		// If the token is a class constructor, use its name as the token
		const className = typeof token === 'function' ? token.name : token;

		if (this.configurations.has(className)) {
			return this.configurations.get(className);
		}

		if (this.resolving.has(className)) {
			throw new Error(`Cyclic dependency detected for token: ${className}`);
		}

		const registered = this.registry.get(className);
		if (!registered) {
			throw new Error(`No provider found for token: ${className}`);
		}

		try {
			this.resolving.add(className);

			if (registered.isSingleton && registered.instance) {
				return registered.instance;
			}

			const instance = this.createInstance(registered.classConstructor);
			if (registered.isSingleton) {
				registered.instance = instance;
			}

			return instance as T;
		} finally {
			this.resolving.delete(className);
		}
	}

	private createInstance<T>(classConstructor: new (...args: any[]) => T): T {
		const paramTypes = Reflect.getMetadata('design:paramtypes', classConstructor) || [];
		const injectedParams = paramTypes.map((paramType: any, index: number) => {
			const token = Reflect.getMetadata('di:inject:params', classConstructor, classConstructor.name) || paramType.name;
			return this.resolve(token);
		});

		const instance = new classConstructor(...injectedParams);

		// Inject fields and methods after the instance has been created
		this.injectFields(instance);
		this.injectMethods(instance);

		return instance;
	}

	private injectFields(instance: any) {
		const fields = Reflect.getMetadata('di:inject:fields', instance.constructor.prototype) || [];
		fields.forEach(({propertyKey, token}: any) => {
			// Resolve by type (token)
			instance[propertyKey] = this.resolve(token);
		});
	}

	private injectMethods(instance: any) {
		const methodKeys = Object.getOwnPropertyNames(instance.constructor.prototype).filter((m) => m !== 'constructor');
		methodKeys.forEach((methodKey) => {
			const tokens = Reflect.getMetadata('di:inject:method', instance, methodKey);
			if (tokens) {
				const dependencies = tokens.map((token: string) => this.resolve(token));
				instance[methodKey](...dependencies);
			}
		});
	}

	setConfiguration(key: string, value: any) {
		this.configurations.set(key, value);
	}

	// Allow manual registration of all annotated classes for automatic handling
	registerAnnotatedClasses(...classes: any[]) {
		classes.forEach(classConstructor => this.registerClass(classConstructor));
	}
}
