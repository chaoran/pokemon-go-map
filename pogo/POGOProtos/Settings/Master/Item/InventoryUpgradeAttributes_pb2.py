# Generated by the protocol buffer compiler.  DO NOT EDIT!
# source: POGOProtos/Settings/Master/Item/InventoryUpgradeAttributes.proto

import sys
_b=sys.version_info[0]<3 and (lambda x:x) or (lambda x:x.encode('latin1'))
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from google.protobuf import reflection as _reflection
from google.protobuf import symbol_database as _symbol_database
from google.protobuf import descriptor_pb2
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from POGOProtos.Inventory import InventoryUpgradeType_pb2 as POGOProtos_dot_Inventory_dot_InventoryUpgradeType__pb2


DESCRIPTOR = _descriptor.FileDescriptor(
  name='POGOProtos/Settings/Master/Item/InventoryUpgradeAttributes.proto',
  package='POGOProtos.Settings.Master.Item',
  syntax='proto3',
  serialized_pb=_b('\n@POGOProtos/Settings/Master/Item/InventoryUpgradeAttributes.proto\x12\x1fPOGOProtos.Settings.Master.Item\x1a/POGOProtos/Inventory/InventoryUpgradeType.proto\"z\n\x1aInventoryUpgradeAttributes\x12\x1a\n\x12\x61\x64\x64itional_storage\x18\x01 \x01(\x05\x12@\n\x0cupgrade_type\x18\x02 \x01(\x0e\x32*.POGOProtos.Inventory.InventoryUpgradeTypeb\x06proto3')
  ,
  dependencies=[POGOProtos_dot_Inventory_dot_InventoryUpgradeType__pb2.DESCRIPTOR,])
_sym_db.RegisterFileDescriptor(DESCRIPTOR)




_INVENTORYUPGRADEATTRIBUTES = _descriptor.Descriptor(
  name='InventoryUpgradeAttributes',
  full_name='POGOProtos.Settings.Master.Item.InventoryUpgradeAttributes',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    _descriptor.FieldDescriptor(
      name='additional_storage', full_name='POGOProtos.Settings.Master.Item.InventoryUpgradeAttributes.additional_storage', index=0,
      number=1, type=5, cpp_type=1, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
    _descriptor.FieldDescriptor(
      name='upgrade_type', full_name='POGOProtos.Settings.Master.Item.InventoryUpgradeAttributes.upgrade_type', index=1,
      number=2, type=14, cpp_type=8, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      options=None),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
  ],
  options=None,
  is_extendable=False,
  syntax='proto3',
  extension_ranges=[],
  oneofs=[
  ],
  serialized_start=150,
  serialized_end=272,
)

_INVENTORYUPGRADEATTRIBUTES.fields_by_name['upgrade_type'].enum_type = POGOProtos_dot_Inventory_dot_InventoryUpgradeType__pb2._INVENTORYUPGRADETYPE
DESCRIPTOR.message_types_by_name['InventoryUpgradeAttributes'] = _INVENTORYUPGRADEATTRIBUTES

InventoryUpgradeAttributes = _reflection.GeneratedProtocolMessageType('InventoryUpgradeAttributes', (_message.Message,), dict(
  DESCRIPTOR = _INVENTORYUPGRADEATTRIBUTES,
  __module__ = 'POGOProtos.Settings.Master.Item.InventoryUpgradeAttributes_pb2'
  # @@protoc_insertion_point(class_scope:POGOProtos.Settings.Master.Item.InventoryUpgradeAttributes)
  ))
_sym_db.RegisterMessage(InventoryUpgradeAttributes)


# @@protoc_insertion_point(module_scope)
