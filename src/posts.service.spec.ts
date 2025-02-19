import { Post, PostsService } from "./posts.service";

describe("PostsService", () => {
  let postsService: PostsService;
  const post: Omit<Post, "id" | "date"> = {
    text: "Mocked post",
  };

  beforeEach(async () => {
    postsService = new PostsService();
    // Создаем пост, который будет использоваться для тестирования поиска
    postsService.create({ text: "Some pre-existing post" });
  });

  it("should add a new post", () => {
    // Создаем новый пост
    const newPost = postsService.create(post);

    // Проверяем, что пост имеет id и date
    expect(newPost).toHaveProperty("id");
    expect(newPost).toHaveProperty("date");
    expect(newPost.text).toBe("Mocked post");

    // Проверяем, что созданный пост можно найти по id
    const foundPost = postsService.find(newPost.id);
    expect(foundPost).toEqual(newPost);
  });

  it("should find a post", () => {
    // Так как в beforeEach был создан пост с id "1"
    const existingPost = postsService.find("1");

    // Проверяем, что пост найден и его текст соответствует ожидаемому
    expect(existingPost).toBeDefined();
    expect(existingPost?.text).toBe("Some pre-existing post");
    expect(existingPost?.id).toBe("1");
  });
});
