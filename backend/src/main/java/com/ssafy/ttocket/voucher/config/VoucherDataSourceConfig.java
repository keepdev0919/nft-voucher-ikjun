package com.ssafy.ttocket.voucher.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
        basePackages = "com.ssafy.ttocket.voucher.repository",
        entityManagerFactoryRef = "voucherEntityManagerFactory",
        transactionManagerRef = "voucherTransactionManager"
)
public class VoucherDataSourceConfig {

    @Bean(name = "voucherDataSource")
    @ConfigurationProperties(prefix = "voucher.datasource")
    public DataSource voucherDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean(name = "voucherEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean voucherEntityManagerFactory(
            @Qualifier("voucherDataSource") DataSource dataSource) {

        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPackagesToScan("com.ssafy.ttocket.voucher.entity");
        em.setPersistenceUnitName("voucherPU");

        HibernateJpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        em.setJpaVendorAdapter(vendorAdapter);

        Map<String, Object> properties = new HashMap<>();
        properties.put("hibernate.hbm2ddl.auto", "update");
        properties.put("hibernate.dialect", "org.hibernate.dialect.MySQL5InnoDBDialect");
        properties.put("hibernate.show_sql", true);
        properties.put("hibernate.format_sql", true);
        em.setJpaPropertyMap(properties);

        return em;
    }

    @Bean(name = "voucherTransactionManager")
    public PlatformTransactionManager voucherTransactionManager(
            @Qualifier("voucherEntityManagerFactory") LocalContainerEntityManagerFactoryBean voucherEntityManagerFactory) {
        JpaTransactionManager transactionManager = new JpaTransactionManager();
        transactionManager.setEntityManagerFactory(voucherEntityManagerFactory.getObject());
        return transactionManager;
    }
}
