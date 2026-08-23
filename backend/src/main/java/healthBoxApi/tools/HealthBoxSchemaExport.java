package healthBoxApi.tools;

import org.hibernate.boot.Metadata;
import org.hibernate.boot.MetadataSources;
import org.hibernate.boot.registry.StandardServiceRegistry;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.hibernate.tool.hbm2ddl.SchemaExport;
import org.hibernate.tool.schema.TargetType;

import javax.persistence.Entity;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.stream.Collectors;

public final class HealthBoxSchemaExport {

    private HealthBoxSchemaExport() {
    }

    public static void main(String[] args) throws Exception {
        if (args.length != 1) {
            throw new IllegalArgumentException("output SQL path is required");
        }

        Path outputPath = Paths.get(args[0]).toAbsolutePath().normalize();
        Files.createDirectories(outputPath.getParent());

        StandardServiceRegistry registry = new StandardServiceRegistryBuilder()
            .applySetting("hibernate.dialect", "org.hibernate.dialect.MariaDB103Dialect")
            .applySetting("hibernate.physical_naming_strategy", "org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl")
            .build();

        try {
            MetadataSources metadataSources = new MetadataSources(registry);
            for (Class<?> entityClass : findEntityClasses()) {
                metadataSources.addAnnotatedClass(entityClass);
            }

            Metadata metadata = metadataSources.buildMetadata();
            new SchemaExport()
                .setDelimiter(";")
                .setFormat(true)
                .setHaltOnError(true)
                .setOutputFile(outputPath.toString())
                .execute(EnumSet.of(TargetType.SCRIPT), SchemaExport.Action.CREATE, metadata);
        } finally {
            StandardServiceRegistryBuilder.destroy(registry);
        }
    }

    private static List<Class<?>> findEntityClasses() throws Exception {
        URI packageUri = HealthBoxSchemaExport.class.getClassLoader().getResource("healthBoxApi/vo").toURI();
        Path packagePath = Paths.get(packageUri);
        try (java.util.stream.Stream<Path> files = Files.list(packagePath)) {
            return files
                .filter(path -> path.getFileName().toString().endsWith(".class"))
                .map(path -> path.getFileName().toString().replaceFirst("\\.class$", ""))
                .filter(className -> !className.contains("$"))
                .map(className -> loadClass("healthBoxApi.vo." + className))
                .filter(type -> type.isAnnotationPresent(Entity.class))
                .sorted(Comparator.comparing(Class::getName))
                .collect(Collectors.toList());
        }
    }

    private static Class<?> loadClass(String className) {
        try {
            return Class.forName(className);
        } catch (ClassNotFoundException error) {
            throw new IllegalStateException("unable to load HealthBox entity " + className, error);
        }
    }
}
