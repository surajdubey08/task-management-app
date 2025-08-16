using AutoMapper;
using TaskManagement.API.DTOs;
using TaskManagement.API.Models;

namespace TaskManagement.API.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // User mappings
            CreateMap<User, UserDto>();
            CreateMap<CreateUserDto, User>();
            CreateMap<UpdateUserDto, User>();

            // Category mappings
            CreateMap<Category, CategoryDto>();
            CreateMap<CreateCategoryDto, Category>();
            CreateMap<UpdateCategoryDto, Category>();

            // Task mappings
            CreateMap<TaskItem, TaskDto>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.Name))
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : null))
                .ForMember(dest => dest.CategoryColor, opt => opt.MapFrom(src => src.Category != null ? src.Category.Color : null));
            
            CreateMap<CreateTaskDto, TaskItem>();
            CreateMap<UpdateTaskDto, TaskItem>();

            // Task Comment mappings
            CreateMap<TaskComment, TaskCommentDto>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.Name));
            CreateMap<CreateTaskCommentDto, TaskComment>();
            CreateMap<UpdateTaskCommentDto, TaskComment>();

            // Task Activity mappings
            CreateMap<TaskActivity, TaskActivityDto>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.Name));

            // Task Dependency mappings
            CreateMap<TaskDependency, TaskDependencyDto>()
                .ForMember(dest => dest.TaskTitle, opt => opt.MapFrom(src => src.Task.Title))
                .ForMember(dest => dest.DependentTaskTitle, opt => opt.MapFrom(src => src.DependentTask.Title))
                .ForMember(dest => dest.CreatedByUserName, opt => opt.MapFrom(src => src.CreatedByUser.Name))
                .ForMember(dest => dest.TaskStatus, opt => opt.MapFrom(src => src.Task.Status))
                .ForMember(dest => dest.DependentTaskStatus, opt => opt.MapFrom(src => src.DependentTask.Status));
            CreateMap<CreateTaskDependencyDto, TaskDependency>();
            CreateMap<TaskItem, TaskWithDependenciesDto>();
        }
    }
}
