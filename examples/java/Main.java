package examples.java;

public class Main {
    public static void main(String[] args) {
        System.out.println("测试 envFileX 扩展");
        System.out.println("环境变量:");
        System.out.println("DB_HOST = " + System.getenv("DB_HOST"));
        System.out.println("API_KEY = " + System.getenv("API_KEY"));
        System.out.println("DEBUG = " + System.getenv("DEBUG"));
    }
}
