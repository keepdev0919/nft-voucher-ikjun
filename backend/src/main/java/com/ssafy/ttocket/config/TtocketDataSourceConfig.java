package com.ssafy.ttocket.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(
        basePackages = "com.ssafy.ttocket.repository",
        entityManagerFactoryRef = "ttocketEntityManagerFactory",
        transactionManagerRef = "ttocketTransactionManager"
)
public class TtocketDataSourceConfig {

    @Bean(name = "ttocketDataSourceProperties")
    @Primary
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties ttocketDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean(name = "ttocketDataSource")
    @Primary
    public DataSource ttocketDataSource(
            @Qualifier("ttocketDataSourceProperties") DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder().build();
    }

    @Bean(name = "ttocketEntityManagerFactory")
    @Primary
    public LocalContainerEntityManagerFactoryBean ttocketEntityManagerFactory(
            @Qualifier("ttocketDataSource") DataSource dataSource) {

        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPackagesToScan("com.ssafy.ttocket.domain");
        em.setPersistenceUnitName("ttocketPU");

        HibernateJpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        em.setJpaVendorAdapter(vendorAdapter);

        Map<String, Object> properties = new HashMap<>();
        properties.put("hibernate.hbm2ddl.auto", "update");
        properties.put("hibernate.dialect", "org.hibernate.dialect.MySQL5InnoDBDialect");
        properties.put("hibernate.show_sql", true);
        properties.put("hibernate.format_sql", true);
        properties.put("hibernate.default_batch_fetch_size", 1000);
        em.setJpaPropertyMap(properties);

        return em;
    }

    @Bean(name = "ttocketTransactionManager")
    @Primary
    public PlatformTransactionManager ttocketTransactionManager(
            @Qualifier("ttocketEntityManagerFactory") LocalContainerEntityManagerFactoryBean factory) {
        JpaTransactionManager tm = new JpaTransactionManager();
        tm.setEntityManagerFactory(factory.getObject());
        return tm;
    }
}
