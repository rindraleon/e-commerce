import * as common from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { articleImageMulterOptions } from '../../common/utils/upload.util';
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
import { ArticlesService } from './articles.service';

interface UploadedArticleFile {
  filename: string;
}

@common.Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @common.Get()
  findPublic(@common.Query() query: ArticleQueryDto) {
    return this.articlesService.findPublic(query);
  }

  @common.Get('admin/all')
  @common.UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  findAll(
    @common.Query() query: ArticleQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.articlesService.findAll(query, userId);
  }

  @common.Get('id/:id')
  @common.UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  findOneById(
    @common.Param('id', common.ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.articlesService.findOneById(id, userId);
  }

  @common.Get(':slug/comments')
  findComments(
    @common.Param('slug') slug: string,
    @common.Query() query: ArticleCommentQueryDto,
  ) {
    return this.articlesService.findComments(slug, query);
  }

  @common.Get(':slug/engagement')
  getEngagement(@common.Param('slug') slug: string) {
    return this.articlesService.getEngagement(slug);
  }

  @common.Post(':slug/comments')
  @common.UseGuards(JwtAuthGuard)
  addComment(
    @common.Param('slug') slug: string,
    @common.Body() dto: CreateArticleCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.articlesService.addComment(slug, dto, userId);
  }

  @common.Post(':slug/like')
  @common.UseGuards(JwtAuthGuard)
  toggleLike(
    @common.Param('slug') slug: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.articlesService.toggleLike(slug, userId);
  }

  @common.Get(':slug')
  findOnePublic(@common.Param('slug') slug: string) {
    return this.articlesService.findOnePublic(slug);
  }

  @common.Post()
  @common.UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  @common.UseInterceptors(
    FileInterceptor('cover_image', articleImageMulterOptions),
  )
  create(
    @common.Body() createArticleDto: CreateArticleDto,
    @common.UploadedFile() file: UploadedArticleFile | undefined,
    @CurrentUser('id') userId: string,
  ) {
    return this.articlesService.create(createArticleDto, file, userId);
  }

  @common.Put(':id')
  @common.UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  @common.UseInterceptors(
    FileInterceptor('cover_image', articleImageMulterOptions),
  )
  update(
    @common.Param('id', common.ParseUUIDPipe) id: string,
    @common.Body() updateArticleDto: UpdateArticleDto,
    @common.UploadedFile() file: UploadedArticleFile | undefined,
    @CurrentUser('id') userId: string,
  ) {
    return this.articlesService.update(id, updateArticleDto, file, userId);
  }

  @common.Delete(':id')
  @common.UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  remove(
    @common.Param('id', common.ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.articlesService.remove(id, userId);
  }
}
