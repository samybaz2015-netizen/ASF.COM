using AutoMapper;
using Microsoft.AspNetCore.Routing.Constraints;
using ASF.Core.Dtos;
using ASF.Core.Dtos.ConstructionResponse;
using ASF.Core.Dtos.EmergencyResponse;
using ASF.Core.Dtos.MaintenanceResponse;
using ASF.Core.Dtos.NewProjectResponse;
using ASF.Core.Dtos.PrivateProjectDto;
using ASF.Core.Dtos.PrivateResponse;
using ASF.Core.DTOs.Pricing;
using ASF.Core.Entities;
using ASF.Core.Entities.Construction;
using ASF.Core.Entities.Emergency;
using ASF.Core.Entities.Maintenance;
using ASF.Core.Entities.NewProject;
using ASF.Core.Entities.PrivateProject;
using static System.Net.Mime.MediaTypeNames;

namespace ASF.Api.Helpers
{
    public class ProfilesMapping:Profile
    {
        public ProfilesMapping() {

           


            #region Map NewProjectDto to NewProject
            CreateMap<NewProjectDto, NewProject>()
             .ForMember(dest => dest.SafetyWastePhotos, opt => opt.Ignore())
             .ForMember(dest => dest.ModelPhotos, opt => opt.Ignore())
             .ForMember(dest => dest.SitePhotos, opt => opt.Ignore());
            #endregion

            #region Map ConstructionDto to Construction
            CreateMap<ConstructionDto, Construction>()
             .ForMember(dest => dest.SafetyWastePhotos, opt => opt.Ignore())
             .ForMember(dest => dest.ModelPhotos, opt => opt.Ignore())
             .ForMember(dest => dest.SitePhotos, opt => opt.Ignore())
             .ForMember(dest => dest.TestModels, opt => opt.Ignore());
            #endregion
            #region Map EmergencyDto to Emergency
            CreateMap<EmergencyDto, Emergency>()
             .ForMember(dest => dest.SafetyWastePhotos, opt => opt.Ignore())
             .ForMember(dest => dest.ModelPhotos, opt => opt.Ignore())
             .ForMember(dest => dest.TestModels, opt => opt.Ignore())
             .ForMember(dest => dest.SitePhotos, opt => opt.Ignore());
            #endregion
            #region Map MaintenanceDto to Maintenance
            CreateMap<MaintenanceDto, Maintenance>()
             .ForMember(dest => dest.SafetyWastePhotos, opt => opt.Ignore())
             .ForMember(dest => dest.ModelPhotos, opt => opt.Ignore())
             .ForMember(dest => dest.TestModels, opt => opt.Ignore())
             .ForMember(dest => dest.SitePhotos, opt => opt.Ignore());
            #endregion
            #region Map PrivateDto to Private
            CreateMap<PrivateProjectDto, PrivateProject>()
             .ForMember(dest => dest.SafetyWastePhotos, opt => opt.Ignore())
             .ForMember(dest => dest.ModelPhotos, opt => opt.Ignore())
             .ForMember(dest => dest.SitePhotos, opt => opt.Ignore());

            CreateMap<PrivateProject, PrivateResponse>()
    .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type))
    .ForMember(dest => dest.ModelPhotos, opt => opt.MapFrom(src => src.ModelPhotos))
    .ForMember(dest => dest.SitePhotos, opt => opt.MapFrom(src => src.SitePhotos))
    .ForMember(dest => dest.SafetyWastePhotos, opt => opt.MapFrom(src => src.SafetyWastePhotos))
    .ForMember(dest => dest.StationNumber, opt => opt.MapFrom(src => src.StationNumber)); // ✅ string to string
            #endregion





            #region Contact ReverseMap
            CreateMap<Contact, ContactDto>().ReverseMap();
            #endregion





         
            #region NewProject to NewProjectResponse
            CreateMap<NewProject, NewProjectResponse>()
                .ForMember(dest => dest.OrderNumber, opt => opt.MapFrom(src => src.FaultNumber))
                .ForMember(dest => dest.PricingItems, opt => opt.MapFrom(src => src.NewProjectPricingItems != null
                    ? src.NewProjectPricingItems.Where(cp => cp.PricingItem != null).Select(cp => new PricingItemResponseDto
                    {
                        Id = cp.PricingItem.Id,
                        ItemNumber = cp.PricingItem.ItemNumber,
                        ShortDescription = cp.PricingItem.ShortDescription,
                        LongDescription = cp.PricingItem.LongDescription,
                        Uom = cp.PricingItem.UOM,
                        UnitPrice = (double)cp.PricingItem.UnitPrice,
                        Currency = cp.PricingItem.Currency,
                        EstimatedQuantity = cp.EstimatedQuantity,
                        ExecutedQuantity = cp.ExecutedQuantity,
                        TotalPrice = cp.TotalPrice,
                        ExecutionPercentage = cp.ExecutionPercentage,
                        ExecutedWorksValue = cp.ExecutedWorksValue
                    }).ToList()
                    : new List<PricingItemResponseDto>()));

            #endregion

            #region Construction to ConstructionResponse
            CreateMap<Construction, ConstructionResponse>()
                .ForMember(dest => dest.OrderNumber, opt => opt.MapFrom(src => src.FaultNumber))
                .ForMember(dest => dest.PricingItems, opt => opt.MapFrom(src => src.ConstructionPricingItems != null
                    ? src.ConstructionPricingItems.Where(cp => cp.PricingItem != null).Select(cp => new PricingItemResponseDto
                    {
                        Id = cp.PricingItem.Id,
                        ItemNumber = cp.PricingItem.ItemNumber,
                        ShortDescription = cp.PricingItem.ShortDescription,
                        LongDescription = cp.PricingItem.LongDescription,
                        Uom = cp.PricingItem.UOM,
                        UnitPrice = (double)cp.PricingItem.UnitPrice,
                        Currency = cp.PricingItem.Currency,
                        EstimatedQuantity = cp.EstimatedQuantity,
                        ExecutedQuantity = cp.ExecutedQuantity,
                        TotalPrice = cp.TotalPrice,
                        ExecutionPercentage = cp.ExecutionPercentage,
                        ExecutedWorksValue = cp.ExecutedWorksValue
                    }).ToList()
                    : new List<PricingItemResponseDto>()));

            #endregion
            #region Emergency to EmergencyResponse
            CreateMap<Emergency, EmergencyResponse>()
                .ForMember(dest => dest.OrderNumber, opt => opt.MapFrom(src => src.FaultNumber))
                .ForMember(dest => dest.PricingItems, opt => opt.MapFrom(src => src.EmergencyPricingItems != null
                    ? src.EmergencyPricingItems.Where(cp => cp.PricingItem != null).Select(cp => new PricingItemResponseDto
                    {
                        Id = cp.PricingItem.Id,
                        ItemNumber = cp.PricingItem.ItemNumber,
                        ShortDescription = cp.PricingItem.ShortDescription,
                        LongDescription = cp.PricingItem.LongDescription,
                        Uom = cp.PricingItem.UOM,
                        UnitPrice = (double)cp.PricingItem.UnitPrice,
                        Currency = cp.PricingItem.Currency,
                        EstimatedQuantity = cp.EstimatedQuantity,
                        ExecutedQuantity = cp.ExecutedQuantity,
                        TotalPrice = cp.TotalPrice,
                        ExecutionPercentage = cp.ExecutionPercentage,
                        ExecutedWorksValue = cp.ExecutedWorksValue
                    }).ToList()
                    : new List<PricingItemResponseDto>()));

            #endregion
            #region Maintenance to MaintenanceResponse
            CreateMap<Maintenance, MaintenanceResponse>()
                .ForMember(dest => dest.OrderNumber, opt => opt.MapFrom(src => src.FaultNumber))
                .ForMember(dest => dest.PricingItems, opt => opt.MapFrom(src => src.MaintenancePricingItems != null
                    ? src.MaintenancePricingItems.Where(cp => cp.PricingItem != null).Select(cp => new PricingItemResponseDto
                    {
                        Id = cp.PricingItem.Id,
                        ItemNumber = cp.PricingItem.ItemNumber,
                        ShortDescription = cp.PricingItem.ShortDescription,
                        LongDescription = cp.PricingItem.LongDescription,
                        Uom = cp.PricingItem.UOM,
                        UnitPrice = (double)cp.PricingItem.UnitPrice,
                        Currency = cp.PricingItem.Currency,
                        EstimatedQuantity = cp.EstimatedQuantity,
                        ExecutedQuantity = cp.ExecutedQuantity,
                        TotalPrice = cp.TotalPrice,
                        ExecutionPercentage = cp.ExecutionPercentage,
                        ExecutedWorksValue = cp.ExecutedWorksValue
                    }).ToList()
                    : new List<PricingItemResponseDto>()));

            #endregion


        }
    }
}
