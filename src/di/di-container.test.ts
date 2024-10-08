import {DiContainer, Inject, InjectMethod, InjectParam, Prototype, Singleton, Value} from "./index";

describe('DIContainer', () => {
	let container: DiContainer;

	beforeEach(() => {
		container = new DiContainer();
	});

	test('should register singleton class', () => {
		@Singleton()
		class Service {
		}

		container.registerClass(Service);
		const instance1 = container.resolve(Service);
		const instance2 = container.resolve(Service);

		expect(instance1).toBe(instance2); // Same instance
	});

	test('should register prototype class', () => {
		@Prototype()
		class Service {
		}

		container.registerClass(Service);
		const instance1 = container.resolve(Service);
		const instance2 = container.resolve(Service);

		expect(instance1).not.toBe(instance2); // Different instances
	});

	test('should inject property using @Inject', () => {
		const container = new DiContainer(); // Initialize the DI container

		@Singleton()
		class Database {
			connect() {
				return 'Connected';
			}
		}

		@Singleton()
		class UserService {
			@Inject() database!: Database;  // Field injection

			getConnection() {
				return this.database.connect();
			}
		}

		// Register both classes in the container
		container.registerAnnotatedClasses(Database, UserService);

		const userService = container.resolve(UserService);
		expect(userService.getConnection()).toBe('Connected'); // Now this should pass
	});

	test('should inject dependencies into method using @InjectMethod', () => {
		const container = new DiContainer(); // Initialize DI container

		@Singleton()
		class Logger {
			log(message: string) {
				return `Log: ${message}`;
			}
		}

		@Singleton()
		class Service {
			private lastLog = '';

			@InjectMethod('Logger')
			initialize(logger: Logger) {
				this.lastLog = logger.log('Service initialized');
			}

			getLastLog() {
				return this.lastLog;
			}
		}

		container.registerAnnotatedClasses(Logger, Service);

		const service = container.resolve(Service);
		expect(service.getLastLog()).toBe('Log: Service initialized'); // Check if method injection works
	});

	test('should inject parameter using @InjectParam', () => {
		@Singleton()
		class GreetingService {
			greet(name: string) {
				return `Hello, ${name}!`;
			}
		}

		@Singleton()
		class UserService {
			constructor(@InjectParam() private greetingService: GreetingService) {
			}

			greetUser(name: string) {
				return this.greetingService.greet(name);
			}
		}

		container.registerClass(GreetingService);
		container.registerClass(UserService);

		const userService = container.resolve(UserService);
		expect(userService.greetUser('Alice')).toBe('Hello, Alice!');
	});

	test('should inject configuration using @Value', () => {
		@Singleton()
		class AppConfig {
			@Value('appName') appName!: string;
		}

		container.setConfiguration('appName', 'MyApp');
		container.registerClass(AppConfig);

		const appConfig = container.resolve(AppConfig);
		expect(appConfig.appName).toBe('MyApp');
	});

	test('should inject configuration using @Value into component', () => {
		const container = new DiContainer();

		container.setConfiguration('dbUrl', 'postgres://localhost:5432/mydb'); // Set configuration

		@Singleton()
		class DatabaseService {
			@Value('dbUrl') databaseUrl!: string;  // Inject config value

			getDatabaseUrl() {
				return this.databaseUrl;
			}
		}

		container.registerAnnotatedClasses(DatabaseService);

		const configService = container.resolve(DatabaseService);
		expect(configService.getDatabaseUrl()).toBe('postgres://localhost:5432/mydb'); // Test configuration injection
	});

	test('should throw error when resolving unregistered class', () => {
		expect(() => container.resolve('NonExistent')).toThrow('No provider found for token: NonExistent');
	});

	test('should manually register all annotated classes', () => {
		@Singleton()
		class Service {
		}

		container.registerAnnotatedClasses(Service);
		const serviceInstance = container.resolve(Service);

		expect(serviceInstance).toBeInstanceOf(Service);
	});
});