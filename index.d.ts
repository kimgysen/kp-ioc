declare module 'kp-ioc' {
	export type ClassConstructor<T> = new (...args: any[]) => T;

	export function Singleton(): ClassDecorator;

	export function Prototype(): ClassDecorator;

	export function Inject(token?: string): PropertyDecorator;

	export function InjectParam(token?: string): ParameterDecorator;

	export function InjectMethod(...tokens: string[]): MethodDecorator;

	export function Value(configKey: string): PropertyDecorator;

	export class DIContainer {
		registerClass<T>(classConstructor: ClassConstructor<T>): void;

		resolve<T>(token: string | ClassConstructor<T>): T;

		setConfiguration(key: string, value: any): void;

		registerAnnotatedClasses(...classes: ClassConstructor<any>[]): void;
	}
}