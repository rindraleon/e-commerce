import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { unlink } from 'fs/promises';
import sanitizeHtml from 'sanitize-html';
import {
  buildArticleImagePublicPath,
  resolveUploadPath,
} from '../../common/utils/upload.util';
import { DatabaseService } from '../../database/database.service';
import { AppRole } from '../../entities/user-role.entity';
import {
  ArticleQueryDto,
  CreateArticleDto,
  UpdateArticleDto,
} from './dto/article.dto';
import {
  ArticleCommentQueryDto,
  CreateArticleCommentDto,
} from './dto/article-comment.dto';

interface UploadedArticleFile {
  filename: string;
}

const articleHtmlOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    'h2',
    'h3',
    'ul',
    'ol',
    'li',
    'blockquote',
    'a',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
};

@Injectable()
export class ArticlesService {
  constructor(private readonly databaseService: DatabaseService) {}

  private async ensureAdmin(userId: string) {
    const isAdmin = await this.databaseService.checkUserRole(
      userId,
      AppRole.ADMIN,
    );
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can manage articles');
    }
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120);
  }

  private async generateUniqueSlug(title: string, articleId?: string) {
    const baseSlug = this.slugify(title) || 'article';
    let candidate = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.databaseService.findArticleBySlug(candidate);
      if (!existing || existing.id === articleId) {
        return candidate;
      }
      candidate = `${baseSlug}-${counter}`;
      counter += 1;
    }
  }

  private sanitizeRichText(value?: string) {
    if (!value) return value;
    return sanitizeHtml(value, articleHtmlOptions);
  }

  private normalizeTags(tags?: string) {
    if (!tags) return undefined;
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  private toEntityPayload(dto: CreateArticleDto | UpdateArticleDto) {
    const isPublished = dto.is_published;
    return {
      title: dto.title,
      titleEn: dto.title_en,
      category: dto.category?.trim() || null,
      tags: this.normalizeTags(dto.tags),
      excerpt: dto.excerpt,
      excerptEn: dto.excerpt_en,
      content: dto.content
        ? this.sanitizeRichText(dto.content) || ''
        : undefined,
      contentEn: dto.content_en
        ? this.sanitizeRichText(dto.content_en)
        : undefined,
      isPublished,
      publishedAt:
        isPublished === undefined ? undefined : isPublished ? new Date() : null,
    };
  }

  private async removeArticleImage(publicPath?: string | null) {
    if (!publicPath) return;
    const absolutePath = resolveUploadPath(publicPath);
    if (!absolutePath) return;
    try {
      await unlink(absolutePath);
    } catch {
      // ignore missing file
    }
  }

  async findPublic(query: ArticleQueryDto) {
    return this.databaseService.findArticles({
      page: query.page,
      limit: query.limit,
      search: query.search,
      published: query.published ?? true,
      category: query.category,
      tag: query.tag,
      sortBy: query.sortBy,
      order: query.order?.toUpperCase() as 'ASC' | 'DESC' | undefined,
    });
  }

  async findAll(query: ArticleQueryDto, userId: string) {
    await this.ensureAdmin(userId);
    return this.databaseService.findArticles({
      page: query.page,
      limit: query.limit,
      search: query.search,
      published: query.published,
      category: query.category,
      tag: query.tag,
      sortBy: query.sortBy,
      order: query.order?.toUpperCase() as 'ASC' | 'DESC' | undefined,
    });
  }

  async findOnePublic(slug: string) {
    const article = await this.databaseService.findArticleBySlug(slug);
    if (!article || !article.isPublished) {
      throw new NotFoundException('Article not found');
    }
    return article;
  }

  async findOneById(id: string, userId: string) {
    await this.ensureAdmin(userId);
    const article = await this.databaseService.findArticleById(id);
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    return article;
  }

  async create(
    createArticleDto: CreateArticleDto,
    file: UploadedArticleFile | undefined,
    userId: string,
  ) {
    await this.ensureAdmin(userId);
    const slug = await this.generateUniqueSlug(createArticleDto.title);
    const payload = this.toEntityPayload(createArticleDto);
    const article = await this.databaseService.createArticle({
      ...payload,
      content: payload.content || '',
      slug,
      coverImageUrl: file ? buildArticleImagePublicPath(file.filename) : null,
    });
    return this.databaseService.findArticleById(article.id);
  }

  async update(
    id: string,
    updateArticleDto: UpdateArticleDto,
    file: UploadedArticleFile | undefined,
    userId: string,
  ) {
    await this.ensureAdmin(userId);
    const article = await this.databaseService.findArticleById(id);
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const payload = this.toEntityPayload(updateArticleDto);
    const slug = updateArticleDto.title
      ? await this.generateUniqueSlug(updateArticleDto.title, id)
      : article.slug;

    let coverImageUrl = article.coverImageUrl;
    if (file) {
      await this.removeArticleImage(article.coverImageUrl);
      coverImageUrl = buildArticleImagePublicPath(file.filename);
    }

    await this.databaseService.updateArticle(id, {
      ...payload,
      slug,
      coverImageUrl,
    });

    return this.databaseService.findArticleById(id);
  }

  async remove(id: string, userId: string) {
    await this.ensureAdmin(userId);
    const article = await this.databaseService.findArticleById(id);
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    await this.removeArticleImage(article.coverImageUrl);
    await this.databaseService.deleteArticle(id);
    return { message: 'Article deleted successfully' };
  }

  async findComments(slug: string, query: ArticleCommentQueryDto) {
    const article = await this.findOnePublic(slug);
    return this.databaseService.findArticleComments(
      article.id,
      query.page,
      query.limit,
    );
  }

  async addComment(slug: string, dto: CreateArticleCommentDto, userId: string) {
    const article = await this.findOnePublic(slug);
    await this.databaseService.createArticleComment({
      articleId: article.id,
      userId,
      content: dto.content.trim(),
      isApproved: true,
    });

    return this.getEngagement(slug, userId);
  }

  async getEngagement(slug: string, userId?: string) {
    const article = await this.findOnePublic(slug);
    const [likeCount, commentCount, liked] = await Promise.all([
      this.databaseService.countArticleLikes(article.id),
      this.databaseService.countArticleComments(article.id),
      userId
        ? this.databaseService.findArticleLike(article.id, userId)
        : Promise.resolve(null),
    ]);

    return {
      articleId: article.id,
      likeCount,
      commentCount,
      likedByCurrentUser: Boolean(liked),
    };
  }

  async toggleLike(slug: string, userId: string) {
    const article = await this.findOnePublic(slug);
    const existingLike = await this.databaseService.findArticleLike(
      article.id,
      userId,
    );

    if (existingLike) {
      await this.databaseService.deleteArticleLike(existingLike.id);
    } else {
      await this.databaseService.createArticleLike({
        articleId: article.id,
        userId,
      });
    }

    return this.getEngagement(slug, userId);
  }
}
