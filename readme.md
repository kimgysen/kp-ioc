# Minimal IOC for Typescript 

Bundle size 6Kb (single file). 

## Supports: 

- Multiple containers 
- Constructor `@InjectParam`, field `@Inject` and `@InjectMethod` method injection 
- `@Singleton` / `@Prototype` components
- `@Value` config property injection 

## Register components 

`container.registerClass(AppConfig);`

Or:

`container.registerAnnotatedClasses(Database, UserService);`

## Examples 

### Register singleton class 

    @Singleton()
    class Service {
    }

    const container = new DiContainer();
    container.registerClass(Service);
    const instance1 = container.resolve(Service);
    const instance2 = container.resolve(Service);
    
    expect(instance1).toBe(instance2); // Same instance


### Register prototype class 

    @Prototype()
    class Service {
    }

    const container = new DiContainer();
    container.registerClass(Service);
    const instance1 = container.resolve(Service);
    const instance2 = container.resolve(Service);
    
    expect(instance1).not.toBe(instance2); // Different instances

### Inject property 

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

### Inject method 

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

### Inject constructor parameter 

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

### Inject configuration @Value 

    @Singleton()
    class AppConfig {
        @Value('appName') appName!: string;
    }

    container.setConfiguration('appName', 'MyApp');
    container.registerClass(AppConfig);

    const appConfig = container.resolve(AppConfig);
    expect(appConfig.appName).toBe('MyApp');

### Inject @Value into component 

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

